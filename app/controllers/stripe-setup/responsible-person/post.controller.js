'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../../paths')
const response = require('../../../utils/response')
const {
  validateMandatoryField, validateOptionalField, validatePostcode, validateDateOfBirth
} = require('./responsible-person-validations')

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

module.exports = (req, res) => {
  const trimmedFormFields = {}
  Object.entries(req.body).forEach(
    ([name, value]) => trimmedFormFields[name] = value.trim()
  );

  const errors = validationRules.reduce((errors, validationRule) => {
    const errorMessage = validate(trimmedFormFields, validationRule.field, validationRule.validator, validationRule.maxLength)
    if (errorMessage) {
      errors[validationRule.field] = errorMessage
    }
    return errors
  }, {})

  const dateOfBirthErrorMessage = validateDoB(trimmedFormFields)
  if (dateOfBirthErrorMessage) {
    errors['dob'] = dateOfBirthErrorMessage
  }

  const pageData = {
    firstName: lodash.get(trimmedFormFields, FIRST_NAME_FIELD),
    lastName: lodash.get(trimmedFormFields, LAST_NAME_FIELD),
    homeAddressLine1: lodash.get(trimmedFormFields, HOME_ADDRESS_LINE1_FIELD),
    homeAddressLine2: lodash.get(trimmedFormFields, HOME_ADDRESS_LINE2_FIELD),
    homeAddressCity: lodash.get(trimmedFormFields, HOME_ADDRESS_CITY_FIELD),
    homeAddressPostcode: lodash.get(trimmedFormFields, HOME_ADDRESS_POSTCODE_FIELD),
    dobDay: lodash.get(trimmedFormFields, DOB_DAY_FIELD),
    dobMonth: lodash.get(trimmedFormFields, DOB_MONTH_FIELD),
    dobYear: lodash.get(trimmedFormFields, DOB_YEAR_FIELD),
  }

  if (!lodash.isEmpty(errors)) {
    pageData['errors'] = errors
    return response.response(req, res, 'stripe-setup/responsible-person/index', pageData)
  } else if (lodash.get(req.body, 'answers-checked') === 'true') {
    return res.redirect(303, paths.dashboard.index)
  } else if (lodash.get(req.body, 'answers-need-changing') === 'true') {
    return response.response(req, res, 'stripe-setup/responsible-person/index', pageData)
  } else {
    return response.response(req, res, 'stripe-setup/responsible-person/check-your-answers', pageData)
  }
}

const validate = (formFields, fieldName, fieldValidator, maxLength) => {
  const field = lodash.get(formFields, fieldName)
  const isFieldValid = fieldValidator(field, maxLength)
  if (!isFieldValid.valid) {
    return isFieldValid.message
  }
  return null
}

const validateDoB = (formFields) => {
  const day = lodash.get(formFields, DOB_DAY_FIELD)
  const month = lodash.get(formFields, DOB_MONTH_FIELD)
  const year = lodash.get(formFields, DOB_YEAR_FIELD)
  const dateOfBirthValidationResult = validateDateOfBirth(day, month, year)
  if (!dateOfBirthValidationResult.valid) {
    return dateOfBirthValidationResult.message
  }
  return null
}
