'use strict'

const moment = require('moment-timezone')
const ukPostcode = require('uk-postcode')

const {
  isEmpty,
  isFieldGreaterThanMaxLengthChars,
  isValidEmail
} = require('../../browsered/field-validation-checks')
const { invalidTelephoneNumber } = require('./telephone-number-validation')

const validReturnObject = {
  valid: true,
  message: null
}

exports.validateOptionalField = function validateOptionalField (value, maxLength) {
  if (!isEmpty(value)) {
    const textTooLongErrorMessage = isFieldGreaterThanMaxLengthChars(value, maxLength)

    if (textTooLongErrorMessage) {
      return {
        valid: false,
        message: textTooLongErrorMessage
      }
    }
  }

  return validReturnObject
}

exports.validateMandatoryField = function validateMandatoryField (value, maxLength) {
  const isEmptyErrorMessage = isEmpty(value)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
    }
  }

  const textTooLongErrorMessage = isFieldGreaterThanMaxLengthChars(value, maxLength)
  if (textTooLongErrorMessage) {
    return {
      valid: false,
      message: textTooLongErrorMessage
    }
  }

  return validReturnObject
}

exports.validatePhoneNumber = function validatePhoneNumber (phoneNumber) {
  const isEmptyErrorMessage = isEmpty(phoneNumber)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
    }
  }

  const phoneNumberInvalid = invalidTelephoneNumber(phoneNumber)
  if (phoneNumberInvalid) {
    return {
      valid: false,
      message: 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
    }
  }

  return validReturnObject
}

exports.validatePostcode = function validatePostcode (postcode, countryCode) {
  const isEmptyErrorMessage = isEmpty(postcode)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
    }
  }

  // only do proper validation on UK postcodes
  if (countryCode && countryCode !== 'GB') {
    return validReturnObject
  }

  if (!/^[A-z0-9 ]+$/.test(postcode)) {
    return {
      valid: false,
      message: 'Please enter a real postcode'
    }
  }

  const postcodeIsInvalid = !ukPostcode.fromString(postcode).isComplete()
  if (postcodeIsInvalid) {
    return {
      valid: false,
      message: 'Please enter a real postcode'
    }
  }

  return validReturnObject
}

exports.validateDateOfBirth = function validateDateOfBirth (day, month, year) {
  const dayIsEmptyErrorMessage = isEmpty(day)
  const monthIsEmptyErrorMessage = isEmpty(month)
  const yearIsEmptyErrorMessage = isEmpty(year)

  if (dayIsEmptyErrorMessage && monthIsEmptyErrorMessage && yearIsEmptyErrorMessage) {
    return {
      valid: false,
      message: 'Enter the date of birth'
    }
  }

  if (dayIsEmptyErrorMessage && !monthIsEmptyErrorMessage && !yearIsEmptyErrorMessage) {
    return {
      valid: false,
      message: 'Date of birth must include a day'
    }
  }

  if (!dayIsEmptyErrorMessage && monthIsEmptyErrorMessage && !yearIsEmptyErrorMessage) {
    return {
      valid: false,
      message: 'Date of birth must include a month'
    }
  }

  if (!dayIsEmptyErrorMessage && !monthIsEmptyErrorMessage && yearIsEmptyErrorMessage) {
    return {
      valid: false,
      message: 'Date of birth must include a year'
    }
  }

  if (dayIsEmptyErrorMessage && monthIsEmptyErrorMessage && !yearIsEmptyErrorMessage) {
    return {
      valid: false,
      message: 'Date of birth must include a day and month'
    }
  }

  if (dayIsEmptyErrorMessage && !monthIsEmptyErrorMessage && yearIsEmptyErrorMessage) {
    return {
      valid: false,
      message: 'Date of birth must include a day and year'
    }
  }

  if (!dayIsEmptyErrorMessage && monthIsEmptyErrorMessage && yearIsEmptyErrorMessage) {
    return {
      valid: false,
      message: 'Date of birth must include a month and year'
    }
  }

  if (!/^[0-9]{1,2}$/.test(day) || !/^[0-9]{1,2}$/.test(month) || !/^[0-9]+$/.test(year)) {
    return {
      valid: false,
      message: 'Enter a real date of birth'
    }
  }

  if (!/^[1-9][0-9]{3}$/.test(year)) {
    return {
      valid: false,
      message: 'Year must have 4 numbers'
    }
  }

  const dateOfBirth = moment({
    year: parseInt(year, 10),
    month: parseInt(month, 10) - 1,
    day: parseInt(day, 10)
  })

  if (!dateOfBirth.isValid()) {
    return {
      valid: false,
      message: 'Enter a real date of birth'
    }
  }

  const now = moment()
  if (dateOfBirth.isAfter(now)) {
    return {
      valid: false,
      message: 'Date of birth must be in the past'
    }
  }

  return validReturnObject
}

exports.validateEmail = function validateEmail (email) {
  const isEmptyErrorMessage = isEmpty(email)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
    }
  }

  const invalidEmailErrorMessage = isValidEmail(email)
  if (invalidEmailErrorMessage) {
    return {
      valid: false,
      message: invalidEmailErrorMessage
    }
  }

  return validReturnObject
}
