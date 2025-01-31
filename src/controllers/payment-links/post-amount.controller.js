'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const amountValidations = require('./validations/amount-validations')

module.exports = async function postAmount (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    return next(new Error('Payment link data not found in session cookie'))
  }

  const type = req.body['amount-type-group']
  const amount = req.body['payment-amount']
  const hint = req.body['amount-hint-text'] && req.body['amount-hint-text'].trim()

  await Promise.all(amountValidations.map(validation => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedErrors = formatValidationErrors(validationErrors)
    sessionData.amountPageRecovered = {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      type,
      hint
    }
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.amount, req.account && req.account.external_id))
  }

  sessionData.paymentLinkAmount = safeConvertPoundsStringToPence(amount)
  sessionData.paymentAmountType = type
  sessionData.amountHint = hint

  if (req.body.change === 'true') {
    req.flash('generic', 'The details have been updated')
  }

  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.review, req.account && req.account.external_id))
}
