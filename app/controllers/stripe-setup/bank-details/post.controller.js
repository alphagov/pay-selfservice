'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const response = require('../../../utils/response')
const bankDetailsValidations = require('./bank-details-validations')

// Constants
const ACCOUNT_NUMBER_FIELD = 'account-number'
const SORT_CODE_FIELD = 'sort-code'

module.exports = (req, res) => {
  if (req.account.payment_provider.toLowerCase() !== 'stripe' ||
    req.account.type.toLowerCase() !== 'live') {
    res.status(404)
    res.render('404')
    return
  }

  const accountNumber = lodash.get(req.body, ACCOUNT_NUMBER_FIELD)
  const sortCode = lodash.get(req.body, SORT_CODE_FIELD)

  const errors = validateBankDetails(accountNumber, sortCode)
  const pageData = {
    accountNumber,
    sortCode,
    errors
  }

  if (lodash.isEmpty(errors)) {
    // go to confirm page
  } else {
    return response.response(req, res, 'stripe-setup/bank-details/index', pageData)
  }

  // TODO
  return response.response(req, res, 'stripe-setup/bank-details/index', pageData)
}

function validateBankDetails (accountNumber, sortCode) {
  const errors = {}

  const accountNumberValidationResult = bankDetailsValidations.validateAccountNumber(accountNumber)
  if (!accountNumberValidationResult.valid) {
    errors[ACCOUNT_NUMBER_FIELD] = accountNumberValidationResult.message
  }

  const sortCodeValidationResult = bankDetailsValidations.validateSortCode(sortCode)
  if (!sortCodeValidationResult.valid) {
    errors[SORT_CODE_FIELD] = sortCodeValidationResult.message
  }

  return errors
}
