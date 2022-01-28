'use strict'

const moment = require('moment-timezone')
const ukPostcode = require('uk-postcode')
const commonPassword = require('common-password')
const lodash = require('lodash')
const { URL } = require('url')

const {
  isEmpty,
  isFieldGreaterThanMaxLengthChars,
  isValidEmail,
  isPasswordLessThanTenChars,
  validationErrors
} = require('./field-validation-checks')
const { invalidTelephoneNumber } = require('../telephone-number-utils')

const NUMBERS_ONLY = new RegExp('^[0-9]+$')
const NAXSI_NOT_ALLOWED_CHARACTERS = ['<', '>', '|']

const validReturnObject = {
  valid: true,
  message: null
}

function notValidReturnObject (message) {
  return {
    valid: false,
    message
  }
}

function validateOptionalField (value, maxLength, fieldDisplayName, checkIsNaxsiSafe) {
  if (!isEmpty(value)) {
    const textTooLongErrorMessage = isFieldGreaterThanMaxLengthChars(value, maxLength)

    if (textTooLongErrorMessage) {
      const errorMessage = fieldDisplayName
        ? `${lodash.upperFirst(fieldDisplayName)} must be ${maxLength} characters or fewer`
        : textTooLongErrorMessage
      return notValidReturnObject(errorMessage)
    }
  }

  if (checkIsNaxsiSafe) {
    return validateNaxsiSafe(value, fieldDisplayName)
  }

  return validReturnObject
}

function validateMandatoryField (value, maxLength, fieldDisplayName, checkIsNaxsiSafe) {
  const isEmptyErrorMessage = isEmpty(value)
  if (isEmpty(value)) {
    let errorMessage = isEmptyErrorMessage
    if (fieldDisplayName) {
      if (['a', 'e', 'i', 'o', 'u'].indexOf(fieldDisplayName[0]) > -1) {
        errorMessage = `Enter an ${fieldDisplayName}`
      } else {
        errorMessage = `Enter a ${fieldDisplayName}`
      }
    }
    return notValidReturnObject(errorMessage)
  }

  const textTooLongErrorMessage = isFieldGreaterThanMaxLengthChars(value, maxLength)
  if (textTooLongErrorMessage) {
    const errorMessage = fieldDisplayName
      ? `${lodash.upperFirst(fieldDisplayName)} must be ${maxLength} characters or fewer`
      : textTooLongErrorMessage
    return notValidReturnObject(errorMessage)
  }

  if (checkIsNaxsiSafe) {
    return validateNaxsiSafe(value, fieldDisplayName)
  }

  return validReturnObject
}

function validateNaxsiSafe (value, fieldDisplayName) {
  if (NAXSI_NOT_ALLOWED_CHARACTERS.some((character) => value.includes(character))) {
    const errorMessage = `${lodash.upperFirst(fieldDisplayName)} must not include ${NAXSI_NOT_ALLOWED_CHARACTERS.join(' ')}`
    return notValidReturnObject(errorMessage)
  }

  return validReturnObject
}

function validatePhoneNumber (phoneNumber) {
  const isEmptyErrorMessage = isEmpty(phoneNumber)
  if (isEmptyErrorMessage) {
    return notValidReturnObject('Enter a telephone number')
  }

  const isPhoneNumberInvalid = invalidTelephoneNumber(phoneNumber)
  if (isPhoneNumberInvalid) {
    return notValidReturnObject(validationErrors.invalidTelephoneNumber)
  }

  return validReturnObject
}

function validatePostcode (postcode, countryCode) {
  const isEmptyErrorMessage = isEmpty(postcode)
  if (isEmptyErrorMessage) {
    return notValidReturnObject('Enter a postcode')
  }

  // only do proper validation on UK postcodes
  if (countryCode && countryCode !== 'GB') {
    return validReturnObject
  }

  if (!/^[A-z0-9 ]+$/.test(postcode)) {
    return notValidReturnObject('Enter a real postcode')
  }

  const postcodeIsInvalid = !ukPostcode.fromString(postcode).isComplete()
  if (postcodeIsInvalid) {
    return notValidReturnObject('Enter a real postcode')
  }

  return validReturnObject
}

function validateDateOfBirth (day, month, year) {
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

function validateEmail (email) {
  if (isEmpty(email)) {
    return notValidReturnObject('Enter an email address')
  }

  const invalidEmailErrorMessage = isValidEmail(email)
  if (invalidEmailErrorMessage) {
    return notValidReturnObject(invalidEmailErrorMessage)
  }

  return validReturnObject
}

function validatePassword (password) {
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

function validateOtp (otp) {
  if (!otp) {
    return notValidReturnObject('Enter your verification code')
  }
  if (!NUMBERS_ONLY.test(otp)) {
    return notValidReturnObject('Enter numbers only')
  }
  return validReturnObject
}

function validateUrl (url) {
  if (isEmpty(url)) {
    return notValidReturnObject('Enter a website address')
  }
  if (!isValidUrl(url)) {
    return notValidReturnObject(validationErrors.invalidUrl)
  }
  return validReturnObject
}

function isValidUrl (url) {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol
      ? ['http:', 'https:'].includes(parsedUrl.protocol)
      : false
  } catch (err) {
    return false
  }
}

module.exports = {
  validateOptionalField,
  validateMandatoryField,
  validateNaxsiSafe,
  validatePhoneNumber,
  validatePostcode,
  validateDateOfBirth,
  validateEmail,
  validatePassword,
  validateOtp,
  validateUrl,
  SERVICE_NAME_MAX_LENGTH: 50
}
