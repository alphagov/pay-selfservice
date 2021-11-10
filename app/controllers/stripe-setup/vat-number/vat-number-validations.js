'use strict'

const { isEmpty, isNotVatNumber, validationErrors } = require('../../../utils/validation/field-validation-checks')

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

exports.validateVatNumberDeclaration = function validateVatNumberDeclaration (value) {
  if (typeof value === 'undefined') {
    return {
      valid: false,
      message: validationErrors.mandatoryQuestion
    }
  }
  return {
    valid: true,
    message: null
  }
}
