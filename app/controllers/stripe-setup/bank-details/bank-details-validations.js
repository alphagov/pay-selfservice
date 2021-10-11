'use strict'

const { isEmpty, isNotAccountNumber, isNotSortCode } = require('../../../utils/validation/field-validation-checks')

exports.validateAccountNumber = (accountNumber) => {
  const isEmptyErrorMessage = isEmpty(accountNumber)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
    }
  }

  const isNotAccountNumberErrorMessage = isNotAccountNumber(accountNumber)
  if (isNotAccountNumberErrorMessage) {
    return {
      valid: false,
      message: isNotAccountNumberErrorMessage
    }
  }

  return {
    valid: true,
    message: null
  }
}

exports.validateSortCode = (sortCode) => {
  const isEmptyErrorMessage = isEmpty(sortCode)
  if (isEmptyErrorMessage) {
    return {
      valid: false,
      message: isEmptyErrorMessage
    }
  }

  const isNotSortCodeErrorMessage = isNotSortCode(sortCode)
  if (isNotSortCodeErrorMessage) {
    return {
      valid: false,
      message: isNotSortCodeErrorMessage
    }
  }

  return {
    valid: true,
    message: null
  }
}
