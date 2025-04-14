'use strict'

const { isEmpty, isNotVatNumber, validationErrors } = require('../../../utils/validation/field-validation-checks')

exports.validateVatNumber = function validateVatNumber (value) {
  if (isEmpty(value)) {
    return {
      valid: false,
      message: validationErrors.missingVatNumber
    }
  }

  return isNotVatNumber(value) ? { valid: false, message: validationErrors.invalidVatNumber } : { valid: true, message: null }
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
