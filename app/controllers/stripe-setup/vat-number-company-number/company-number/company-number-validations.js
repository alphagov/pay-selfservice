'use strict'

// Local dependencies
const { isEmpty, isNotCompanyNumber } = require('../../../../browsered/field-validation-checks')

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
