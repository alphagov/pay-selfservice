'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential, getSwitchingCredential } = require('../../../utils/credentials')
const { response } = require('../../../utils/response')
const { validateMandatoryField, validateEmail } = require('../../../utils/validation/server-side-form-validations')
const { listPersons, updateDirector, createDirector, updateCompany } = require('../../../services/clients/stripe/stripe.client')
const { validateDateOfBirth } = require('../../../utils/validation/server-side-form-validations')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const FIRST_NAME_FIELD = 'first-name'
const LAST_NAME_FIELD = 'last-name'
const EMAIL_FIELD = 'email'
const DOB_DAY_FIELD = 'dob-day'
const DOB_MONTH_FIELD = 'dob-month'
const DOB_YEAR_FIELD = 'dob-year'
const listOfFields = [FIRST_NAME_FIELD, LAST_NAME_FIELD, EMAIL_FIELD, DOB_DAY_FIELD, DOB_MONTH_FIELD, DOB_YEAR_FIELD]
const validationRules = [
  {
    field: FIRST_NAME_FIELD,
    validator: validateMandatoryField,
    maxLength: 100
  },
  {
    field: LAST_NAME_FIELD,
    validator: validateMandatoryField,
    maxLength: 100
  },
  {
    field: EMAIL_FIELD,
    validator: validateEmail,
    maxLength: 320
  }
]
const trimField = (key, store) => lodash.get(store, key, '').trim()

module.exports = async function (req, res, next) {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const collectingAdditionalKycData = isAdditionalKycDataRoute(req)
  const currentCredential = getCurrentCredential(req.account)

  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.director) {
    req.flash('genericError', 'You’ve already provided director details. Contact GOV.UK Pay support if you need to change them.')
    return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
  }

  const formFields = getFormFields(req.body, listOfFields)
  const errors = validateDirector(req.body, formFields)

  if (!lodash.isEmpty(errors)) {
    const pageData = {
      firstName: formFields[FIRST_NAME_FIELD],
      lastName: formFields[LAST_NAME_FIELD],
      email: formFields[EMAIL_FIELD],
      dobDay: formFields[DOB_DAY_FIELD],
      dobMonth: formFields[DOB_MONTH_FIELD],
      dobYear: formFields[DOB_YEAR_FIELD]
    }

    pageData['errors'] = errors

    return response(req, res, 'stripe-setup/director/index', {
      ...pageData, isSwitchingCredentials, collectingAdditionalKycData, currentCredential
    })
  } else {
    try {
      const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials, req.correlationId)
      const personsResponse = await listPersons(stripeAccountId)
      const data = lodash.get(personsResponse, 'data')
      const director = data !== undefined ? data.filter(person => person.relationship && person.relationship.director === true).pop() : undefined

      if (director && director.id) {
        await updateDirector(stripeAccountId, director.id, buildStripePerson(formFields))
      } else {
        await createDirector(stripeAccountId, buildStripePerson(formFields))
      }

      await updateCompany(stripeAccountId, { directors_provided: true })
      await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'director', req.correlationId)

      logger.info('Director details submitted for Stripe account', {
        stripe_account_id: stripeAccountId,
        is_switching: isSwitchingCredentials,
        collectingAdditionalKycData: collectingAdditionalKycData
      })
      if (isSwitchingCredentials) {
        return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
      } else if (collectingAdditionalKycData) {
        req.flash('generic', 'Details of director successfully completed')
        return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account && req.account.external_id, currentCredential.external_id))
      } else {
        return res.redirect(303, formatAccountPathsFor(paths.account.stripe.addPspAccountDetails, req.account && req.account.external_id))
      }
    } catch (err) {
      next(err)
    }
  }
}

async function getStripeAccountId (account, isSwitchingCredentials, correlationId) {
  if (isSwitchingCredentials) {
    const switchingCredential = getSwitchingCredential(account)
    return switchingCredential.credentials.stripe_account_id
  } else {
    const stripeAccount = await connector.getStripeAccount(account.gateway_account_id, correlationId)
    return stripeAccount.stripeAccountId
  }
}

function getFormFields (requestBody, listOfFields) {
  return listOfFields.reduce((form, field) => {
    form[field] = trimField(field, requestBody)
    return form
  }, {})
}

function validateDirector (requestBody, formFields) {
  const errors = validationRules.reduce((errors, validationRule) => {
    const errorMessage = validateField(formFields[validationRule.field], validationRule.validator, validationRule.maxLength)
    if (errorMessage) {
      errors[validationRule.field] = errorMessage
    }
    return errors
  }, {})

  const dateOfBirthErrorMessage = validateDoB(formFields[DOB_DAY_FIELD], formFields[DOB_MONTH_FIELD], formFields[DOB_YEAR_FIELD])
  if (dateOfBirthErrorMessage) {
    errors['dob'] = dateOfBirthErrorMessage
  }

  return errors
}

function validateField (field, fieldValidator, maxLength) {
  const isFieldValid = fieldValidator(field, maxLength)
  if (!isFieldValid.valid) {
    return isFieldValid.message
  }
  return null
}

function validateDoB (day, month, year) {
  const dateOfBirthValidationResult = validateDateOfBirth(day, month, year)
  if (!dateOfBirthValidationResult.valid) {
    return dateOfBirthValidationResult.message
  }
  return null
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
