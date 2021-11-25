'use strict'

const lodash = require('lodash')
const ukPostcode = require('uk-postcode')

const logger = require('../../../utils/logger')(__filename)
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential } = require('../../../utils/credentials')
const {
  validateField,
  validateDoB,
  getFormFields,
  getStripeAccountId,
  getAlreadySubmittedErrorPageData,
  completeKyc
} = require('../stripe-setup.util')
const { response } = require('../../../utils/response')
const {
  validateMandatoryField,
  validateOptionalField,
  validatePostcode,
  validatePhoneNumber,
  validateEmail
} = require('../../../utils/validation/server-side-form-validations')
const { formatPhoneNumberWithCountryCode } = require('../../../utils/telephone-number-utils')
const { listPersons, updatePerson, createPerson } = require('../../../services/clients/stripe/stripe.client')
const { isKycTaskListComplete } = require('../../../controllers/your-psp/kyc-tasks.service')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

const FIRST_NAME_FIELD = 'first-name'
const LAST_NAME_FIELD = 'last-name'
const HOME_ADDRESS_LINE1_FIELD = 'home-address-line-1'
const HOME_ADDRESS_LINE2_FIELD = 'home-address-line-2'
const HOME_ADDRESS_CITY_FIELD = 'home-address-city'
const HOME_ADDRESS_POSTCODE_FIELD = 'home-address-postcode'
const DOB_DAY_FIELD = 'dob-day'
const DOB_MONTH_FIELD = 'dob-month'
const DOB_YEAR_FIELD = 'dob-year'
const TELEPHONE_NUMBER_FIELD = 'telephone-number'
const EMAIL_FIELD = 'email'

const fields = [
  FIRST_NAME_FIELD,
  LAST_NAME_FIELD,
  HOME_ADDRESS_LINE1_FIELD,
  HOME_ADDRESS_LINE2_FIELD,
  HOME_ADDRESS_CITY_FIELD,
  HOME_ADDRESS_POSTCODE_FIELD,
  DOB_DAY_FIELD,
  DOB_MONTH_FIELD,
  DOB_YEAR_FIELD,
  TELEPHONE_NUMBER_FIELD,
  EMAIL_FIELD
]

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
    field: HOME_ADDRESS_LINE1_FIELD,
    validator: validateMandatoryField,
    maxLength: 200,
    fieldDisplayName: 'building name, number and street'
  },
  {
    field: HOME_ADDRESS_LINE2_FIELD,
    validator: validateOptionalField,
    maxLength: 200,
    fieldDisplayName: 'Building name, number and street'
  },
  {
    field: HOME_ADDRESS_CITY_FIELD,
    validator: validateMandatoryField,
    maxLength: 100,
    fieldDisplayName: 'town or city'
  },
  {
    field: HOME_ADDRESS_POSTCODE_FIELD,
    validator: validatePostcode
  },
  {
    field: TELEPHONE_NUMBER_FIELD,
    validator: validatePhoneNumber
  },
  {
    field: EMAIL_FIELD,
    validator: validateEmail
  }
]

module.exports = async function submitResponsiblePerson (req, res, next) {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const isSubmittingAdditionalKycData = isAdditionalKycDataRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
  const currentCredential = getCurrentCredential(req.account)

  if (!isSubmittingAdditionalKycData) {
    if (!stripeAccountSetup) {
      return next(new Error('Stripe setup progress is not available on request'))
    }
    if (stripeAccountSetup.responsiblePerson) {
      const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
        'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
      return response(req, res, 'error-with-link', errorPageData)
    }
  }

  const formFields = getFormFields(req.body, fields)

  const errors = validateForm(formFields)

  const pageData = {
    firstName: formFields[FIRST_NAME_FIELD],
    lastName: formFields[LAST_NAME_FIELD],
    homeAddressLine1: formFields[HOME_ADDRESS_LINE1_FIELD],
    homeAddressLine2: formFields[HOME_ADDRESS_LINE2_FIELD],
    homeAddressCity: formFields[HOME_ADDRESS_CITY_FIELD],
    homeAddressPostcode: formFields[HOME_ADDRESS_POSTCODE_FIELD],
    dobDay: formFields[DOB_DAY_FIELD],
    dobMonth: formFields[DOB_MONTH_FIELD],
    dobYear: formFields[DOB_YEAR_FIELD],
    telephone: formFields[TELEPHONE_NUMBER_FIELD],
    email: formFields[EMAIL_FIELD]
  }

  if (!lodash.isEmpty(errors)) {
    pageData['errors'] = errors
    return response(req, res, 'stripe-setup/responsible-person/index', {
      ...pageData,
      isSwitchingCredentials,
      isSubmittingAdditionalKycData,
      currentCredential
    })
  } else {
    try {
      const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials, req.correlationId)
      const personsResponse = await listPersons(stripeAccountId)
      const responsiblePerson = personsResponse.data.filter(person => person.relationship && person.relationship.representative).pop()

      const stripePerson = buildStripePerson(formFields)
      if (responsiblePerson !== undefined) {
        await updatePerson(stripeAccountId, responsiblePerson.id, stripePerson)
      } else {
        await createPerson(stripeAccountId, stripePerson)
      }
      logger.info('Responsible person details submitted for Stripe account', {
        stripe_account_id: stripeAccountId,
        is_switching: isSwitchingCredentials,
        collecting_additional_kyc_data: isSubmittingAdditionalKycData
      })

      if (!isSubmittingAdditionalKycData) {
        await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'responsible_person', req.correlationId)
      }

      if (isSwitchingCredentials) {
        req.flash('generic', 'Responsible person details added successfully')
        return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
      } else if (isSubmittingAdditionalKycData) {
        const taskListComplete = await isKycTaskListComplete(currentCredential)
        if (taskListComplete) {
          await completeKyc(req.account.gateway_account_id, req.service, stripeAccountId, req.correlationId)
          req.flash('generic', 'You’ve successfully added all the Know your customer details for this service.')
        } else {
          req.flash('generic', 'Responsible person details added successfully')
        }
        return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account && req.account.external_id, currentCredential.external_id))
      } else {
        return res.redirect(303, formatAccountPathsFor(paths.account.stripe.addPspAccountDetails, req.account && req.account.external_id))
      }
    } catch (err) {
      next(err)
    }
  }
}

function validateForm (formFields) {
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
    errors[DOB_DAY_FIELD] = dateOfBirthErrorMessage
  }

  const orderedErrors = lodash.pick(errors, fields)
  return orderedErrors
}

function buildStripePerson (formFields) {
  const stripePerson = {
    first_name: formFields[FIRST_NAME_FIELD],
    last_name: formFields[LAST_NAME_FIELD],
    address_line1: formFields[HOME_ADDRESS_LINE1_FIELD],
    address_city: formFields[HOME_ADDRESS_CITY_FIELD],
    address_postcode: ukPostcode.fromString(formFields[HOME_ADDRESS_POSTCODE_FIELD]).toString(),
    dob_day: parseInt(formFields[DOB_DAY_FIELD], 10),
    dob_month: parseInt(formFields[DOB_MONTH_FIELD], 10),
    dob_year: parseInt(formFields[DOB_YEAR_FIELD], 10),
    phone: formatPhoneNumberWithCountryCode(formFields[TELEPHONE_NUMBER_FIELD]),
    email: formFields[EMAIL_FIELD]
  }
  if (formFields[HOME_ADDRESS_LINE2_FIELD]) {
    stripePerson.address_line2 = formFields[HOME_ADDRESS_LINE2_FIELD]
  }
  return stripePerson
}
