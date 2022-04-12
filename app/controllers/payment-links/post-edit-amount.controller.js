'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')
const { validateOptionalField } = require('../../utils/validation/server-side-form-validations')

const HINT_MAX_LENGTH = 255

module.exports = function postEditAmount(req, res) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }

  const showAmountHintField = process.env.PAYMENT_LINKS_FUTURE_ENABLED === 'true' || sessionData.newPaymentLinkJourneyEnabled

  const type = req.body['amount-type-group']
  const amount = req.body['payment-amount']
  const hint = req.body['amount-hint-text'] && req.body['amount-hint-text'].trim()

  let amountInPence = ''
  const errors = {}
  if (!type) {
    errors.type = 'Is the payment for a fixed amount?'
  } else if (type === 'fixed') {
    amountInPence = safeConvertPoundsStringToPence(amount)
    if (amount === '' || amountInPence === null) {
      errors.amount = 'Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”'
    }
  } else if (showAmountHintField) {
    const validateHintResult = validateOptionalField(hint, HINT_MAX_LENGTH, 'hint text', true)
    if (!validateHintResult.valid) {
      errors.hint = validateHintResult.message
    }
  }

  if (!lodash.isEmpty(errors)) {
    sessionData.amountPageRecovered = {
      errors,
      type,
      amount: '',
      hint
    }
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.editAmount, req.account && req.account.external_id, productExternalId))
  }

  sessionData.price = amountInPence
  if (showAmountHintField) {
    sessionData.amountHint = hint
  }
  lodash.set(req, 'session.editPaymentLinkData', sessionData)

  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.edit, req.account && req.account.external_id, productExternalId))
}
