'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

module.exports = function postAmount (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    return next(new Error('Payment link data not found in session cookie'))
  }

  const type = req.body['amount-type-group']
  const amount = req.body['payment-amount']

  let amountInPence = ''
  const errors = {}
  if (!type) {
    errors.type = 'Is the payment for a fixed amount?'
  } else if (type === 'fixed') {
    amountInPence = safeConvertPoundsStringToPence(amount)
    if (amount === '' || amountInPence === null) {
      errors.amount = 'Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”'
    }
  }

  if (!lodash.isEmpty(errors)) {
    sessionData.amountPageRecovered = {
      errors,
      type
    }
    return res.redirect(paths.paymentLinks.amount)
  }

  sessionData.paymentLinkAmount = amountInPence
  sessionData.paymentAmountType = type

  if (req.body['change'] === 'true') {
    req.flash('generic', 'The details have been updated')
  }

  if (process.env.PAYMENT_LINKS_INLINE_REPORTING_COLUMNS === 'true') {
    sessionData.isPaymentLinksInlineReportingColumns = true
  }

  return res.redirect(paths.paymentLinks.review)
}
