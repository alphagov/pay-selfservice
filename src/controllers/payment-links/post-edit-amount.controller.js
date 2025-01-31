'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')
const amountValidations = require('@controllers/payment-links/validations/amount-validations')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')

module.exports = async function postEditAmount (req, res) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
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
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.editAmount, req.account && req.account.external_id, productExternalId))
  }

  sessionData.price = req.body['amount-type-group'] === 'fixed' ? safeConvertPoundsStringToPence(amount) : ''
  sessionData.amountHint = hint
  lodash.set(req, 'session.editPaymentLinkData', sessionData)

  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.edit, req.account && req.account.external_id, productExternalId))
}
