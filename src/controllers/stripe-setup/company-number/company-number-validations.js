'use strict'

const {
  validationErrors,
  isEmpty,
  isNotCompanyNumber
} = require('../../../utils/validation/field-validation-checks')

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
  if (isEmpty(value)) {
    return {
      valid: false,
      message: 'Enter a Company registration number'
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
