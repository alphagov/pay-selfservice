'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const response = require('../../../utils/response')
const bankDetailsValidations = require('./bank-details-validations')
const paths = require('../../../paths')

// Constants
const ACCOUNT_NUMBER_FIELD = 'account-number'
const SORT_CODE_FIELD = 'sort-code'
const ANSWERS_NEED_CHANGING_FIELD = 'answers-need-changing'
const ANSWERS_CHECKED_FIELD = 'answers-checked'

module.exports = (req, res) => {
  if (req.account.payment_provider.toLowerCase() !== 'stripe' ||
    req.account.type.toLowerCase() !== 'live') {
    res.status(404)
    res.render('404')
    return
  }

  const accountNumber = req.body[ACCOUNT_NUMBER_FIELD]
  const sortCode = req.body[SORT_CODE_FIELD]

  const errors = validateBankDetails(accountNumber, sortCode)
  const pageData = {
    accountNumber,
    sortCode,
    errors
  }

  if (!lodash.isEmpty(errors)) {
    return response.response(req, res, 'stripe-setup/bank-details/index', pageData)
  }
  if (req.body[ANSWERS_NEED_CHANGING_FIELD]) {
    return response.response(req, res, 'stripe-setup/bank-details/index', pageData)
  }
  if (req.body[ANSWERS_CHECKED_FIELD]) {
    // TODO: Stripe submission
    return res.redirect(303, paths.dashboard.index)
  }
  return response.response(req, res, 'stripe-setup/bank-details/check-your-answers', pageData)
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
