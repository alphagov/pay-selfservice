'use strict'

// NPM dependencies
const ukPostcode = require('uk-postcode')

// Local dependencies
const {
  isEmpty, isFieldGreaterThanMaxLengthChars, isInvalidUkPostcode
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
