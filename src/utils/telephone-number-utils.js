'use strict'

const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber')
const phoneNumberUtilInstance = PhoneNumberUtil.getInstance()

function invalidTelephoneNumber (telephoneNumber) {
  if (!telephoneNumber) {
    return true
  }

  try {
    const parsedTelephoneNumber = phoneNumberUtilInstance.parseAndKeepRawInput(telephoneNumber, 'GB')
    return !phoneNumberUtilInstance.isValidNumber(parsedTelephoneNumber)
  } catch (e) {
    return true
  }
}

function formatPhoneNumberWithCountryCode (telephoneNumber) {
  const parsedNumber = phoneNumberUtilInstance.parseAndKeepRawInput(telephoneNumber, 'GB')
  return phoneNumberUtilInstance.format(parsedNumber, PhoneNumberFormat.INTERNATIONAL)
}

module.exports = {
  invalidTelephoneNumber,
  formatPhoneNumberWithCountryCode
}
