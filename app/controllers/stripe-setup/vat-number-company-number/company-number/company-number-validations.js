'use strict'

// Local dependencies
const { isEmpty } = require('../../../../browsered/field-validation-checks')

exports.validateCompanyNumber = function validateCompanyNumber (value) {
  const isEmptyErrorMessage = isEmpty(value)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
    }
  }

  // TODO
  // implement "isNotCompanyNumber" in field-validation-checks

  return {
    valid: true,
    message: null
  }
}
