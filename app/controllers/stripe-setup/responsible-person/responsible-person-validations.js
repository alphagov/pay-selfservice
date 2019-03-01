'use strict'

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

  const invalidPostcodeErrorMessage = isInvalidUkPostcode(postcode)
  if (invalidPostcodeErrorMessage) {
    return {
      valid: false,
      message: invalidPostcodeErrorMessage
    }
  }

  return {
    valid: true,
    message: null
  }

}
