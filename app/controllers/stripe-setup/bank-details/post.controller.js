'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../../utils/logger')(__filename)
const { response, renderErrorView } = require('../../../utils/response')
const bankDetailsValidations = require('./bank-details-validations')
const { updateBankAccount } = require('../../../services/clients/stripe/stripe_client')
const { ConnectorClient } = require('../../../services/clients/connector_client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../../../paths')
const fieldValidationChecks = require('../../../browsered/field-validation-checks')

// Constants
const ACCOUNT_NUMBER_FIELD = 'account-number'
const SORT_CODE_FIELD = 'sort-code'

module.exports = (req, res) => {
  const rawAccountNumber = lodash.get(req.body, ACCOUNT_NUMBER_FIELD, '')
  const rawSortCode = lodash.get(req.body, SORT_CODE_FIELD, '')
  const sanitisedAccountNumber = rawAccountNumber.replace(/\D/g, '')
  const sanitisedSortCode = rawSortCode.replace(/\D/g, '')

  const errors = validateBankDetails(rawAccountNumber, rawSortCode)
  if (!lodash.isEmpty(errors)) {
    return response(req, res, 'stripe-setup/bank-details/index', {
      accountNumber: rawAccountNumber,
      sortCode: rawSortCode,
      errors
    })
  }

  return updateBankAccount(res.locals.stripeAccount.stripeAccountId, {
    bank_account_sort_code: sanitisedSortCode,
    bank_account_number: sanitisedAccountNumber
  })
    .then(() => {
      return connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'bank_account', req.correlationId)
    })
    .then(() => {
      return res.redirect(303, paths.stripe.addPspAccountDetails)
    })
    .catch(error => {
      // check if it is Stripe related error
      if (error.code) {
        if (error.code === 'routing_number_invalid') {
          // invalid sort code
          return response(req, res, 'stripe-setup/bank-details/index', {
            accountNumber: rawAccountNumber,
            sortCode: rawSortCode,
            errors: {
              [SORT_CODE_FIELD]: fieldValidationChecks.validationErrors.invalidSortCode
            }
          })
        }
        if (error.code === 'account_number_invalid') {
          // invalid account number
          return response(req, res, 'stripe-setup/bank-details/index', {
            accountNumber: rawAccountNumber,
            sortCode: rawSortCode,
            errors: {
              [ACCOUNT_NUMBER_FIELD]: fieldValidationChecks.validationErrors.invalidBankAccountNumber
            }
          })
        }
      }
      // the error is generic
      logger.error(`[${req.correlationId}] Error submitting bank details, error = `, error)
      return renderErrorView(req, res, 'Please try again or contact support team')
    })
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
