'use strict'

const { isEmpty, isNotVatNumber } = require('../../../../browsered/field-validation-checks')

exports.validateVatNumber = function validateVatNumber (value) {
  const isEmptyErrorMessage = isEmpty(value)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
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
