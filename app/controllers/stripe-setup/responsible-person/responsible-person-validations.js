'use strict'

// NPM dependencies
const moment = require('moment-timezone')
const ukPostcode = require('uk-postcode')

// Local dependencies
const {
  isEmpty,
  isFieldGreaterThanMaxLengthChars
} = require('../../../browsered/field-validation-checks')

exports.validateOptionalField = (value, maxLength) => {
  if (!isEmpty(value)) {
    const textTooLongErrorMessage = isFieldGreaterThanMaxLengthChars(value, maxLength)

    if (textTooLongErrorMessage) {
      return {
        valid: false,
        message: textTooLongErrorMessage
      }
    }
  }

  return {
    valid: true,
    message: null
  }
}

exports.validateMandatoryField = (value, maxLength) => {
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

  return {
    valid: true,
    message: null
  }
}

exports.validatePostcode = (postcode) => {
  const isEmptyErrorMessage = isEmpty(postcode)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
    }
  }

  const postcodeIsInvalid = !ukPostcode.fromString(postcode).isComplete()
  if (postcodeIsInvalid) {
    return {
      valid: false,
      message: 'Please enter a real postcode'
    }
  }

  return {
    valid: true,
    message: null
  }
}

exports.validateDateOfBirth = (day, month, year) => {
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

  if (!/^[0-9]{1,2}$/.test(day) || !/^[0-9]{1,2}$/.test(month) || !/^[1-9][0-9]{3}$/.test(year)) {
    return {
      valid: false,
      message: 'Enter a real date of birth'
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

  return {
    valid: true,
    message: null
  }
}
