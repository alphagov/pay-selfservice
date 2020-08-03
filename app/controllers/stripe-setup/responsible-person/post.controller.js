'use strict'

// NPM dependencies
const lodash = require('lodash')
const ukPostcode = require('uk-postcode')

// Local dependencies
const paths = require('../../../paths')
const logger = require('../../../utils/logger')(__filename)
const { response, renderErrorView } = require('../../../utils/response')
const {
  validateMandatoryField, validateOptionalField, validatePostcode, validateDateOfBirth
} = require('../../../utils/validation/server-side-form-validations')
const { listPersons, updatePerson } = require('../../../services/clients/stripe/stripe.client')
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
    field: HOME_ADDRESS_LINE1_FIELD,
    validator: validateMandatoryField,
    maxLength: 200
  },
  {
    field: HOME_ADDRESS_LINE2_FIELD,
    validator: validateOptionalField,
    maxLength: 200
  },
  {
    field: HOME_ADDRESS_CITY_FIELD,
    validator: validateMandatoryField,
    maxLength: 100
  },
  {
    field: HOME_ADDRESS_POSTCODE_FIELD,
    validator: validatePostcode
  }
]

const trimField = (key, store) => lodash.get(store, key, '').trim()

module.exports = async function (req, res) {
  const fields = [
    FIRST_NAME_FIELD,
    LAST_NAME_FIELD,
    HOME_ADDRESS_LINE1_FIELD,
    HOME_ADDRESS_LINE2_FIELD,
    HOME_ADDRESS_CITY_FIELD,
    HOME_ADDRESS_POSTCODE_FIELD,
    DOB_DAY_FIELD,
    DOB_MONTH_FIELD,
    DOB_YEAR_FIELD
  ]
  const formFields = fields.reduce((form, field) => {
    form[field] = trimField(field, req.body)
    return form
  }, {})

  const errors = validationRules.reduce((errors, validationRule) => {
    const errorMessage = validate(formFields, validationRule.field, validationRule.validator, validationRule.maxLength)
    if (errorMessage) {
      errors[validationRule.field] = errorMessage
    }
    return errors
  }, {})

  const dateOfBirthErrorMessage = validateDoB(formFields)
  if (dateOfBirthErrorMessage) {
    errors['dob'] = dateOfBirthErrorMessage
  }

  const pageData = {
    firstName: formFields[FIRST_NAME_FIELD],
    lastName: formFields[LAST_NAME_FIELD],
    homeAddressLine1: formFields[HOME_ADDRESS_LINE1_FIELD],
    homeAddressLine2: formFields[HOME_ADDRESS_LINE2_FIELD],
    homeAddressCity: formFields[HOME_ADDRESS_CITY_FIELD],
    homeAddressPostcode: formFields[HOME_ADDRESS_POSTCODE_FIELD],
    dobDay: formFields[DOB_DAY_FIELD],
    dobMonth: formFields[DOB_MONTH_FIELD],
    dobYear: formFields[DOB_YEAR_FIELD]
  }

  if (!lodash.isEmpty(errors)) {
    pageData['errors'] = errors
    return response(req, res, 'stripe-setup/responsible-person/index', pageData)
  } else {
    try {
      const stripeAccountId = res.locals.stripeAccount.stripeAccountId
      const personsResponse = await listPersons(stripeAccountId)
      const person = personsResponse.data.pop()
      await updatePerson(stripeAccountId, person.id, buildStripePerson(formFields))
      await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'responsible_person', req.correlationId)

      return res.redirect(303, paths.stripe.addPspAccountDetails)
    } catch (error) {
      logger.error(`[requestId=${req.correlationId}] Error creating responsible person with Stripe - ${error.message}`)
      return renderErrorView(req, res, 'Please try again or contact support team')
    }
  }
}

const buildStripePerson = (formFields) => {
  const stripePerson = {
    first_name: formFields[FIRST_NAME_FIELD],
    last_name: formFields[LAST_NAME_FIELD],
    address_line1: formFields[HOME_ADDRESS_LINE1_FIELD],
    address_city: formFields[HOME_ADDRESS_CITY_FIELD],
    address_postcode: ukPostcode.fromString(formFields[HOME_ADDRESS_POSTCODE_FIELD]).toString(),
    dob_day: parseInt(formFields[DOB_DAY_FIELD], 10),
    dob_month: parseInt(formFields[DOB_MONTH_FIELD], 10),
    dob_year: parseInt(formFields[DOB_YEAR_FIELD], 10)
  }
  if (formFields[HOME_ADDRESS_LINE2_FIELD]) {
    stripePerson.address_line2 = formFields[HOME_ADDRESS_LINE2_FIELD]
  }
  return stripePerson
}

const validate = (formFields, fieldName, fieldValidator, maxLength) => {
  const field = formFields[fieldName]
  const isFieldValid = fieldValidator(field, maxLength)
  if (!isFieldValid.valid) {
    return isFieldValid.message
  }
  return null
}

const validateDoB = (formFields) => {
  const day = formFields[DOB_DAY_FIELD]
  const month = formFields[DOB_MONTH_FIELD]
  const year = formFields[DOB_YEAR_FIELD]
  const dateOfBirthValidationResult = validateDateOfBirth(day, month, year)
  if (!dateOfBirthValidationResult.valid) {
    return dateOfBirthValidationResult.message
  }
  return null
}
