'use strict'

// Local dependencies
const { isEmpty, isNotVatNumber, isFieldGreaterThanMaxLengthChars } = require('../../../browsered/field-validation-checks')

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

  const isNotVatNumberErrorMessage = isNotVatNumber(value)
  if (isNotVatNumberErrorMessage) {
    return {
      valid: false,
      message: isNotVatNumberErrorMessage
    }
  }

  return {
    valid: true,
    message: null
  }
}
