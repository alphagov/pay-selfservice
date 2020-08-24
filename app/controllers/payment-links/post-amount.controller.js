'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)
  const paymentAmountType = req.body['amount-type-group']
  const paymentLinkAmount = req.body['payment-amount']

  if (!paymentAmountType) {
    req.flash('error', 'Is the payment for a fixed amount?')
    req.flash('errorType', 'paymentAmountType')
    return res.redirect(paths.paymentLinks.amount)
  }

  let formattedPaymentLinkAmount = safeConvertPoundsStringToPence(paymentLinkAmount)

  if (paymentLinkAmount !== '' && formattedPaymentLinkAmount === null) {
    req.flash('error', 'Enter the amount')
    req.flash('errorType', 'paymentAmountFormat')
    return res.redirect(paths.paymentLinks.amount)
  }

  if (paymentAmountType === 'variable') {
    formattedPaymentLinkAmount = ''
  }

  updatedPageData.paymentLinkAmount = formattedPaymentLinkAmount
  updatedPageData.paymentAmountType = paymentAmountType
  lodash.set(req, 'session.pageData.createPaymentLink', updatedPageData)

  if (pageData.paymentLinkAmount && pageData.paymentLinkAmount !== formattedPaymentLinkAmount) {
    req.flash('generic', 'The details have been updated')
  }

  return res.redirect(paths.paymentLinks.review)
}
