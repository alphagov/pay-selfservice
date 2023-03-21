'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential, isEnableStripeOnboardingTaskListRoute } = require('../../../utils/credentials')
const { response } = require('../../../utils/response')
const { validateMandatoryField, validateEmail } = require('../../../utils/validation/server-side-form-validations')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')
const { listPersons, updateDirector, createDirector, updateCompany } = require('../../../services/clients/stripe/stripe.client')
const {
  validateField,
  validateDoB,
  getFormFields,
  getStripeAccountId,
  getAlreadySubmittedErrorPageData,
  completeKyc
} = require('../stripe-setup.util')
const { isKycTaskListComplete } = require('../../../controllers/your-psp/kyc-tasks.service')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const FIRST_NAME_FIELD = 'first-name'
const LAST_NAME_FIELD = 'last-name'
const EMAIL_FIELD = 'email'
const DOB_DAY_FIELD = 'dob-day'
const DOB_MONTH_FIELD = 'dob-month'
const DOB_YEAR_FIELD = 'dob-year'
const listOfFields = [FIRST_NAME_FIELD, LAST_NAME_FIELD, DOB_DAY_FIELD, DOB_MONTH_FIELD, DOB_YEAR_FIELD, EMAIL_FIELD]
const validationRules = [
  {
    field: FIRST_NAME_FIELD,
    validator: validateMandatoryField,
    maxLength: 100,
    fieldDisplayName: 'first name'
  },
  {
    field: LAST_NAME_FIELD,
    validator: validateMandatoryField,
    maxLength: 100,
    fieldDisplayName: 'last name'
  },
  {
    field: EMAIL_FIELD,
    validator: validateEmail
  }
]

module.exports = async function (req, res, next) {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const enableStripeOnboardingTaskList = isEnableStripeOnboardingTaskListRoute(req)
  const collectingAdditionalKycData = isAdditionalKycDataRoute(req)
  const currentCredential = getCurrentCredential(req.account)

  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.director) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already provided director details. Contact GOV.UK Pay support if you need to change them.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  const formFields = getFormFields(req.body, listOfFields)
  const errors = validateDirector(formFields)

  const pageData = {
    firstName: formFields[FIRST_NAME_FIELD],
    lastName: formFields[LAST_NAME_FIELD],
    email: formFields[EMAIL_FIELD],
    dobDay: formFields[DOB_DAY_FIELD],
    dobMonth: formFields[DOB_MONTH_FIELD],
    dobYear: formFields[DOB_YEAR_FIELD]
  }
  if (!lodash.isEmpty(errors)) {
    pageData['errors'] = errors

    return response(req, res, 'stripe-setup/director/index', {
      ...pageData, isSwitchingCredentials, collectingAdditionalKycData, currentCredential, enableStripeOnboardingTaskList
    })
  } else {
    try {
      const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials)
      const personsResponse = await listPersons(stripeAccountId)
      const data = lodash.get(personsResponse, 'data')
      const director = data !== undefined ? data.filter(person => person.relationship && person.relationship.director === true).pop() : undefined

      if (director && director.id) {
        await updateDirector(stripeAccountId, director.id, buildStripePerson(formFields))
      } else {
        await createDirector(stripeAccountId, buildStripePerson(formFields))
      }

      await updateCompany(stripeAccountId, { directors_provided: true })
      await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'director')

      logger.info('Director details submitted for Stripe account', {
        stripe_account_id: stripeAccountId,
        is_switching: isSwitchingCredentials,
        collecting_additional_kyc_data: collectingAdditionalKycData
      })

      if (isSwitchingCredentials) {
        return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
      } else if (enableStripeOnboardingTaskList) {
        return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account && req.account.external_id, req.params && req.params.credentialId))
      } else if (collectingAdditionalKycData) {
        const taskListComplete = await isKycTaskListComplete(currentCredential)
        if (taskListComplete) {
          await completeKyc(req.account.gateway_account_id, req.service, stripeAccountId)
          req.flash('generic', 'You’ve successfully added all the Know your customer details for this service.')
        } else {
          req.flash('generic', 'Details of director successfully completed')
        }
        return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account && req.account.external_id, currentCredential.external_id))
      }

      return res.redirect(303, formatAccountPathsFor(paths.account.stripe.addPspAccountDetails, req.account && req.account.external_id))
    } catch (err) {
      if (err && err.type === 'StripeInvalidRequestError' && err.param === 'dob[year]') {
        return response(req, res, 'stripe-setup/director/index', {
          ...pageData,
          isSwitchingCredentials,
          collectingAdditionalKycData,
          currentCredential,
          enableStripeOnboardingTaskList,
          errors: {
            [DOB_DAY_FIELD]: validationErrors.invalidDateOfBirth
          }
        })
      }
      next(err)
    }
  }
}

function validateDirector (formFields) {
  const errors = validationRules.reduce((errors, validationRule) => {
    const errorMessage = validateField(formFields[validationRule.field], validationRule.validator,
      validationRule.maxLength, validationRule.fieldDisplayName)
    if (errorMessage) {
      errors[validationRule.field] = errorMessage
    }
    return errors
  }, {})

  const dateOfBirthErrorMessage = validateDoB(formFields[DOB_DAY_FIELD], formFields[DOB_MONTH_FIELD], formFields[DOB_YEAR_FIELD])
  if (dateOfBirthErrorMessage) {
    errors['dob-day'] = dateOfBirthErrorMessage
  }

  const orderedErrors = lodash.pick(errors, listOfFields)
  return orderedErrors
}

function buildStripePerson (formFields) {
  return {
    first_name: formFields[FIRST_NAME_FIELD],
    last_name: formFields[LAST_NAME_FIELD],
    email: formFields[EMAIL_FIELD],
    dob_day: parseInt(formFields[DOB_DAY_FIELD], 10),
    dob_month: parseInt(formFields[DOB_MONTH_FIELD], 10),
    dob_year: parseInt(formFields[DOB_YEAR_FIELD], 10)
  }
}
