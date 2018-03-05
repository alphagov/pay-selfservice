'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')

const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{2}))?$/

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)
  const paymentAmountType = req.body['amount-type-group']
  const paymentLinkAmount = req.body['payment-amount']

  if (!paymentAmountType) {
    req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#fixed-or-variable">Is the payment for a fixed amount?</a></li></ul>`)
    req.flash('errorType', `paymentAmountType`)
    return res.redirect(paths.paymentLinks.amount)
  }

  let formattedPaymentLinkAmount = paymentLinkAmount.replace(/[^0-9.-]+/g, '')
  const currencyMatch = AMOUNT_FORMAT.exec(formattedPaymentLinkAmount)

  if (paymentLinkAmount !== '' && currencyMatch === null) {
    req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#payment-amount">Enter the amount</a></li></ul>`)
    req.flash('errorType', `paymentAmountFormat`)
    return res.redirect(paths.paymentLinks.amount)
  }

  if (formattedPaymentLinkAmount && !currencyMatch[2]) {
    formattedPaymentLinkAmount = paymentLinkAmount + '.00'
  }

  if (paymentAmountType === 'variable') {
    formattedPaymentLinkAmount = ''
  }

  updatedPageData.paymentLinkAmount = formattedPaymentLinkAmount
  lodash.set(req, 'session.pageData.createPaymentLink', updatedPageData)

  if (pageData.paymentLinkAmount && pageData.paymentLinkAmount !== formattedPaymentLinkAmount) {
    req.flash('generic', `<h2>The details have been updated</h2>`)
  }

  return res.redirect(paths.paymentLinks.review)
}
