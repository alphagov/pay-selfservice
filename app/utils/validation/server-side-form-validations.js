'use strict'

const moment = require('moment-timezone')
const ukPostcode = require('uk-postcode')
const commonPassword = require('common-password')

const {
  isEmpty,
  isFieldGreaterThanMaxLengthChars,
  isValidEmail,
  isPasswordLessThanTenChars
} = require('../../browsered/field-validation-checks')
const { invalidTelephoneNumber } = require('./telephone-number-validation')

const NUMBERS_ONLY = new RegExp('^[0-9]+$')

const validReturnObject = {
  valid: true,
  message: null
}

const notValidReturnObject = message => {
  return {
    valid: false,
    message
  }
}

const validateOptionalField = function validateOptionalField (value, maxLength) {
  if (!isEmpty(value)) {
    const textTooLongErrorMessage = isFieldGreaterThanMaxLengthChars(value, maxLength)

    if (textTooLongErrorMessage) {
      return notValidReturnObject(textTooLongErrorMessage)
    }
  }

  return validReturnObject
}

const validateMandatoryField = function validateMandatoryField (value, maxLength) {
  const isEmptyErrorMessage = isEmpty(value)
  if (isEmpty(value)) {
    return notValidReturnObject(isEmptyErrorMessage)
  }

  const textTooLongErrorMessage = isFieldGreaterThanMaxLengthChars(value, maxLength)
  if (textTooLongErrorMessage) {
    return notValidReturnObject(textTooLongErrorMessage)
  }

  return validReturnObject
}

const validatePhoneNumber = function validatePhoneNumber (phoneNumber) {
  const isEmptyErrorMessage = isEmpty(phoneNumber)
  if (isEmptyErrorMessage) {
    return notValidReturnObject('Enter a telephone number')
  }

  const isPhoneNumberInvalid = invalidTelephoneNumber(phoneNumber)
  if (isPhoneNumberInvalid) {
    return notValidReturnObject('Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
  }

  return validReturnObject
}

const validatePostcode = function validatePostcode (postcode, countryCode) {
  const isEmptyErrorMessage = isEmpty(postcode)
  if (isEmptyErrorMessage) {
    return notValidReturnObject('Enter a postcode')
  }

  // only do proper validation on UK postcodes
  if (countryCode && countryCode !== 'GB') {
    return validReturnObject
  }

  if (!/^[A-z0-9 ]+$/.test(postcode)) {
    return notValidReturnObject('Please enter a real postcode')
  }

  const postcodeIsInvalid = !ukPostcode.fromString(postcode).isComplete()
  if (postcodeIsInvalid) {
    return notValidReturnObject('Please enter a real postcode')
  }

  return validReturnObject
}

const validateDateOfBirth = function validateDateOfBirth (day, month, year) {
  const dayIsEmptyErrorMessage = isEmpty(day)
  const monthIsEmptyErrorMessage = isEmpty(month)
  const yearIsEmptyErrorMessage = isEmpty(year)

  if (dayIsEmptyErrorMessage && monthIsEmptyErrorMessage && yearIsEmptyErrorMessage) {
    return notValidReturnObject('Enter the date of birth')
  }

  if (dayIsEmptyErrorMessage && !monthIsEmptyErrorMessage && !yearIsEmptyErrorMessage) {
    return notValidReturnObject('Date of birth must include a day')
  }

  if (!dayIsEmptyErrorMessage && monthIsEmptyErrorMessage && !yearIsEmptyErrorMessage) {
    return notValidReturnObject('Date of birth must include a month')
  }

  if (!dayIsEmptyErrorMessage && !monthIsEmptyErrorMessage && yearIsEmptyErrorMessage) {
    return notValidReturnObject('Date of birth must include a year')
  }

  if (dayIsEmptyErrorMessage && monthIsEmptyErrorMessage && !yearIsEmptyErrorMessage) {
    return notValidReturnObject('Date of birth must include a day and month')
  }

  if (dayIsEmptyErrorMessage && !monthIsEmptyErrorMessage && yearIsEmptyErrorMessage) {
    return notValidReturnObject('Date of birth must include a day and year')
  }

  if (!dayIsEmptyErrorMessage && monthIsEmptyErrorMessage && yearIsEmptyErrorMessage) {
    return notValidReturnObject('Date of birth must include a month and year')
  }

  if (!/^[0-9]{1,2}$/.test(day) || !/^[0-9]{1,2}$/.test(month) || !/^[0-9]+$/.test(year)) {
    return notValidReturnObject('Enter a real date of birth')
  }

  if (!/^[1-9][0-9]{3}$/.test(year)) {
    return notValidReturnObject('Year must have 4 numbers')
  }

  const dateOfBirth = moment({
    year: parseInt(year, 10),
    month: parseInt(month, 10) - 1,
    day: parseInt(day, 10)
  })

  if (!dateOfBirth.isValid()) {
    return notValidReturnObject('Enter a real date of birth')
  }

  const now = moment()
  if (dateOfBirth.isAfter(now)) {
    return notValidReturnObject('Date of birth must be in the past')
  }

  return validReturnObject
}

const validateEmail = function validateEmail (email) {
  if (isEmpty(email)) {
    return notValidReturnObject('Enter an email address')
  }

  const invalidEmailErrorMessage = isValidEmail(email)
  if (invalidEmailErrorMessage) {
    return notValidReturnObject(invalidEmailErrorMessage)
  }

  return validReturnObject
}

const validatePassword = function validatePassword (password) {
  if (isEmpty(password)) {
    return notValidReturnObject('Enter a password')
  }

  const invalidPasswordMessage = isPasswordLessThanTenChars(password)
  if (invalidPasswordMessage) {
    return notValidReturnObject(invalidPasswordMessage)
  }

  if (commonPassword(password)) {
    return notValidReturnObject('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.')
  }

  return validReturnObject
}

const validateOtp = function validateOtp (otp) {
  if (!otp) {
    return notValidReturnObject('Enter your verification code')
  }
  if (!NUMBERS_ONLY.test(otp)) {
    return notValidReturnObject('Enter numbers only')
  }
  return validReturnObject
}

module.exports = {
  validateOptionalField,
  validateMandatoryField,
  validatePhoneNumber,
  validatePostcode,
  validateDateOfBirth,
  validateEmail,
  validatePassword,
  validateOtp
}
