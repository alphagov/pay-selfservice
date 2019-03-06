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
  const errors = validationRules.reduce((errors, validationRule) => {
    const errorMessage = validate(req, validationRule.field, validationRule.validator, validationRule.maxLength)
    if (errorMessage) {
      errors[validationRule.field] = errorMessage
    }
    return errors
  }, {})

  const dateOfBirthErrorMessage = validateDoB(req)
  if (dateOfBirthErrorMessage) {
    errors['dob'] = dateOfBirthErrorMessage
  }

  const pageData = {
    firstName: lodash.get(req.body, FIRST_NAME_FIELD),
    lastName: lodash.get(req.body, LAST_NAME_FIELD),
    homeAddressLine1: lodash.get(req.body, HOME_ADDRESS_LINE1_FIELD),
    homeAddressLine2: lodash.get(req.body, HOME_ADDRESS_LINE2_FIELD),
    homeAddressCity: lodash.get(req.body, HOME_ADDRESS_CITY_FIELD),
    homeAddressPostcode: lodash.get(req.body, HOME_ADDRESS_POSTCODE_FIELD),
    dobDay: lodash.get(req.body, DOB_DAY_FIELD),
    dobMonth: lodash.get(req.body, DOB_MONTH_FIELD),
    dobYear: lodash.get(req.body, DOB_YEAR_FIELD),
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

const validate = (req, fieldName, fieldValidator, maxLength) => {
  const field = lodash.get(req.body, fieldName)
  const isFieldValid = fieldValidator(field, maxLength)
  if (!isFieldValid.valid) {
    return isFieldValid.message
  }
  return null
}

const validateDoB = (req) => {
  const day = lodash.get(req.body, DOB_DAY_FIELD)
  const month = lodash.get(req.body, DOB_MONTH_FIELD)
  const year = lodash.get(req.body, DOB_YEAR_FIELD)
  const dateOfBirthValidationResult = validateDateOfBirth(day, month, year)
  if (!dateOfBirthValidationResult.valid) {
    return dateOfBirthValidationResult.message
  }
  return null
}
