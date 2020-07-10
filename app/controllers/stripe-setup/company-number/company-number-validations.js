'use strict'

// Local dependencies
const {
  validationErrors,
  isEmpty,
  isNotCompanyNumber
} = require('../../../browsered/field-validation-checks')

exports.validateCompanyNumberDeclaration = function validateCompanyNumberDeclaration (value) {
  if (!value) {
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

exports.validateCompanyNumber = function validateCompanyNumber (value) {
  const isEmptyErrorMessage = isEmpty(value)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
    }
  }

  const isNotCompanyNumberErrorMessage = isNotCompanyNumber(value)
  if (isNotCompanyNumberErrorMessage) {
    return {
      valid: false,
      message: isNotCompanyNumberErrorMessage
    }
  }

  return {
    valid: true,
    message: null
  }
}
