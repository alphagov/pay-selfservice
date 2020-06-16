'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const { sanitisePoundsAndPenceInput } = require('../../utils/currency_formatter')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)
  const paymentAmountType = req.body['amount-type-group']
  const paymentLinkAmount = req.body['payment-amount']

  if (!paymentAmountType) {
    req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="govuk-list govuk-error-summary__list"><li><a href="#fixed-or-variable">Is the payment for a fixed amount?</a></li></ul>`)
    req.flash('errorType', `paymentAmountType`)
    return res.redirect(paths.paymentLinks.amount)
  }

  let formattedPaymentLinkAmount = sanitisePoundsAndPenceInput(paymentLinkAmount)

  if (paymentLinkAmount !== '' && formattedPaymentLinkAmount === null) {
    req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="govuk-list govuk-error-summary__list"><li><a href="#payment-amount">Enter the amount</a></li></ul>`)
    req.flash('errorType', `paymentAmountFormat`)
    return res.redirect(paths.paymentLinks.amount)
  }

  if (paymentAmountType === 'variable') {
    formattedPaymentLinkAmount = ''
  }

  updatedPageData.paymentLinkAmount = formattedPaymentLinkAmount
  updatedPageData.paymentAmountType = paymentAmountType
  lodash.set(req, 'session.pageData.createPaymentLink', updatedPageData)

  if (pageData.paymentLinkAmount && pageData.paymentLinkAmount !== formattedPaymentLinkAmount) {
    req.flash('generic', `<h2>The details have been updated</h2>`)
  }

  return res.redirect(paths.paymentLinks.review)
}
