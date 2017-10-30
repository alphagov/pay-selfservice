'use strict'

// local dependencies
const emailValidator = require('../utils/email_tools.js')

// Constants
const NUMBERS_ONLY = new RegExp('^[0-9]+$')

const validationErrors = {
  required: 'This is field cannot be blank',
  currency: 'Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”',
  phoneNumber: 'Must be a 11 digit phone number',
  validEmail: 'Please use a valid email address'
}

module.exports.isEmpty = function (value) {
  if (value === '') {
    return validationErrors.required
  } else {
    return false
  }
}

module.exports.isCurrency = function (value) {
  if (!/^([0-9]+)(?:\.([0-9]{2}))?$/.test(value)) {
    return validationErrors.currency
  } else {
    return false
  }
}

module.exports.isValidEmail = function (value) {
  if (!emailValidator(value)) {
    return validationErrors.validEmail
  } else {
    return false
  }
}

module.exports.isPhoneNumber = function (value) {
  const trimmedTelephoneNumber = value.replace(/\s/g, '')
  if (trimmedTelephoneNumber.length < 11 || !NUMBERS_ONLY.test(trimmedTelephoneNumber)) {
    return validationErrors.phoneNumber
  } else {
    return false
  }
}
