'use strict'

const { PhoneNumberUtil } = require('google-libphonenumber')
const phoneNumberUtilInstance = PhoneNumberUtil.getInstance()

module.exports = {
  invalidTelephoneNumber: telephoneNumber => {
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
}
