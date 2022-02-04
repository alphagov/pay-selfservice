'use strict'

const emailValidator = require('../email-tools.js')

// Constants
const MAX_AMOUNT = 100000

const validationErrors = {
  required: 'This field cannot be blank',
  mandatoryQuestion: 'You must answer this question',
  currency: 'Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”',
  phoneNumber: 'Must be an 11 digit phone number',
  validEmail: 'Enter a valid email address',
  isHttps: 'URL must begin with https://',
  invalidUrl: 'Enter a valid website address',
  isAboveMaxAmount: `Enter an amount under £${MAX_AMOUNT.toLocaleString()}`,
  isPasswordLessThanTenChars: 'Password must be 10 characters or more', // pragma: allowlist secret
  isGreaterThanMaxLengthChars: 'The text is too long',
  invalidCharacters: 'You cannot use any of the following characters < > ; |',
  invalidBankAccountNumber: 'Enter a valid account number like 00733445',
  invalidSortCode: 'Enter a valid sort code like 309430',
  invalidVatNumber: 'Enter your VAT registration number in the correct format',
  missingVatNumber: 'Enter your VAT registration number',
  invalidCompanyNumber: 'Enter a valid Company registration number',
  sevenDigitCompanyNumber: 'Company numbers in England and Wales have 8 digits and always start with 0',
  invalidWorldpay3dsFlexOrgUnitId: 'Enter your organisational unit ID in the format you received it',
  invalidWorldpay3dsFlexIssuer: 'Enter your issuer in the format you received it',
  invalidWorldpay3dsFlexJwtMacKey: 'Enter your JWT MAC key in the format you received it',
  invalidDateOfBirth: 'Enter a valid date',
  invalidTelephoneNumber: 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
}

exports.validationErrors = validationErrors

exports.isEmpty = function (value) {
  if (value === '') {
    return validationErrors.required
  } else {
    return false
  }
}

exports.isCurrency = function (value) {
  if (!/^([0-9]+)(?:\.([0-9]{1,2}))?$/.test(value)) {
    return validationErrors.currency
  } else {
    return false
  }
}

exports.isValidEmail = function (value) {
  if (!emailValidator(value)) {
    return validationErrors.validEmail
  } else {
    return false
  }
}

exports.isHttps = function (value) {
  if (value.substr(0, 8) !== 'https://') {
    return validationErrors.isHttps
  } else {
    return false
  }
}

exports.isAboveMaxAmount = value => {
  if (!exports.isCurrency(value) && parseFloat(value) > MAX_AMOUNT) {
    return validationErrors.isAboveMaxAmount
  }
  return false
}

exports.isFieldGreaterThanMaxLengthChars = (value, maxLength) => {
  const parsedMaxLength = parseInt(maxLength)
  return parsedMaxLength && value.length > parsedMaxLength ? validationErrors.isGreaterThanMaxLengthChars : false
}

exports.isPasswordLessThanTenChars = value => !value || value.length < 10 ? validationErrors.isPasswordLessThanTenChars : false

exports.isNotAccountNumber = value => {
  if (/^[0-9]{6,8}$/.test(value)) {
    return false
  } else {
    return validationErrors.invalidBankAccountNumber
  }
}

exports.isNotSortCode = value => {
  if (/^(?:[ -]*[0-9][ -]*){6}$/.test(value)) {
    return false
  } else {
    return validationErrors.invalidSortCode
  }
}

exports.isNotVatNumber = value => {
  const sanitisedVatNumber = value.replace(/\s/g, '').toUpperCase()
  const vatRE = /^((G{1}B{1})?((\d{9})|(\d{12})|((G{1}D{1})([0-4]{1})(\d{2}))|((H{1}A{1})([5-9]{1})(\d{2}))))$/
  // negate the result
  return !vatRE.test(sanitisedVatNumber)
}

exports.isNotCompanyNumber = value => {
  const sanitisedCompanyNumber = value.replace(/\s/g, '').toUpperCase()

  if (/^[0-9]{7}$/.test(sanitisedCompanyNumber)) {
    return validationErrors.sevenDigitCompanyNumber
  } else if (!/^(?:0[0-9]|OC|LP|SC|SO|SL|NI|R0|NC|NL)[0-9]{6}$/.test(sanitisedCompanyNumber)) {
    return validationErrors.invalidCompanyNumber
  }

  return false
}

exports.isNotWorldpay3dsFlexOrgUnitId = value => {
  if (/^[0-9a-f]{24}$/.test(value)) {
    return false
  } else {
    return validationErrors.invalidWorldpay3dsFlexOrgUnitId
  }
}

exports.isNotWorldpay3dsFlexIssuer = value => {
  if (/^[0-9a-f]{24}$/.test(value)) {
    return false
  } else {
    return validationErrors.invalidWorldpay3dsFlexIssuer
  }
}

exports.isNotWorldpay3dsFlexJwtMacKey = value => {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)) {
    return false
  } else {
    return validationErrors.invalidWorldpay3dsFlexJwtMacKey
  }
}
