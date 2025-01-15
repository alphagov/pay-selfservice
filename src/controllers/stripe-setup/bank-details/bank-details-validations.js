'use strict'

const { isEmpty, isNotAccountNumber, isNotSortCode } = require('../../../utils/validation/field-validation-checks')

exports.validateAccountNumber = (accountNumber) => {
  if (isEmpty(accountNumber)) {
    return {
      valid: false,
      message: 'Enter an account number'
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
  if (isEmpty(sortCode)) {
    return {
      valid: false,
      message: 'Enter a sort code'
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
