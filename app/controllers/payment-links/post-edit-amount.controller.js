'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

module.exports = (req, res) => {
  const paymentAmountType = req.body['amount-type-group']
  const paymentLinkAmount = req.body['payment-amount']
  const editData = lodash.get(req, 'session.editPaymentLinkData', {})

  if (!paymentAmountType) {
    req.flash('error', 'Is the payment for a fixed amount?')
    req.flash('errorType', 'paymentAmountType')
    return res.redirect(formattedPathFor(paths.paymentLinks.editAmount, req.params.productExternalId))
  }

  let sanitisedAmount = safeConvertPoundsStringToPence(paymentLinkAmount)

  if (paymentLinkAmount !== '' && sanitisedAmount === null) {
    req.flash('error', 'Enter the amount')
    req.flash('errorType', 'paymentAmountFormat')
    return res.redirect(formattedPathFor(paths.paymentLinks.editAmount, req.params.productExternalId))
  }

  if (paymentAmountType === 'variable') {
    sanitisedAmount = ''
  }

  editData.price = sanitisedAmount
  lodash.set(req, 'session.editPaymentLinkData', editData)

  return res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
}
