'use strict'

// Local dependencies
const emailValidator = require('../utils/email_tools.js')

// Constants
const NUMBERS_ONLY = new RegExp('^[0-9]+$')
const MAX_AMOUNT = 100000

const validationErrors = {
  required: 'This field cannot be blank',
  mandatoryQuestion: 'You must answer this question',
  currency: 'Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”',
  phoneNumber: 'Must be a 11 digit phone number',
  validEmail: 'Please use a valid email address',
  isHttps: 'URL must begin with https://',
  isAboveMaxAmount: `Choose an amount under £${MAX_AMOUNT.toLocaleString()}`,
  isPasswordLessThanTenChars: 'Choose a Password of 10 characters or longer',
  isGreaterThanMaxLengthChars: 'The text is too long',
  invalidCharacters: `You cannot use any of the following characters < > ; |`,
  invalidBankAccountNumber: 'Enter a valid account number',
  invalidSortCode: 'Enter a valid sort code',
  invalidVatNumber: 'Enter a valid VAT number',
  invalidCompanyNumber: 'Enter a valid company number',
  sevenDigitCompanyNumber: 'Company numbers in England and Wales have 8 digits and always start with 0',
  invalidWorldpay3dsFlexOrgUnitId: 'Enter your organisational unit ID in the format you received it',
  invalidWorldpay3dsFlexIssuer: 'Enter your issuer in the format you received it',
  invalidWorldpay3dsFlexJwtMacKey: 'Enter your JWT MAC key in the format you received it'
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

exports.isPhoneNumber = function (value) {
  const noWhitespaceTelephoneNumber = value.replace(/\s/g, '')
  if (noWhitespaceTelephoneNumber.length < 11 || !NUMBERS_ONLY.test(noWhitespaceTelephoneNumber)) {
    return validationErrors.phoneNumber
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
  let parsedMaxLength = parseInt(maxLength)
  return parsedMaxLength && value.length > parsedMaxLength ? validationErrors.isGreaterThanMaxLengthChars : false
}

exports.isPasswordLessThanTenChars = value => !value || value.length < 10 ? validationErrors.isPasswordLessThanTenChars : false

exports.isNaxsiSafe = function (value) {
  if (/[<>;|]+/g.test(value)) {
    return validationErrors.invalidCharacters
  } else {
    return false
  }
}

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

  if (/^GB[0-9]{9}$/.test(sanitisedVatNumber)) {
    return false
  } else if (/^GB[0-9]{12}$/.test(sanitisedVatNumber)) {
    return false
  } else if (/^GBGD[0-4][0-9]{2}$/.test(sanitisedVatNumber)) {
    return false
  } else if (/^GBHA[5-9][0-9]{2}$/.test(sanitisedVatNumber)) {
    return false
  } else {
    return validationErrors.invalidVatNumber
  }
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
