'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = function showAmountPage (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    return next(new Error('Payment link data not found in session cookie'))
  }

  const recovered = sessionData.amountPageRecovered || {}
  delete sessionData.amountPageRecovered

  const paymentLinkAmount = recovered.amount || sessionData.paymentLinkAmount || ''
  const paymentAmountType = recovered.type || sessionData.paymentAmountType || ''

  return response(req, res, 'payment-links/amount', {
    paymentLinkAmount,
    paymentAmountType,
    nextPage: paths.paymentLinks.amount,
    returnToStart: paths.paymentLinks.start,
    manage: paths.paymentLinks.managePage,
    isWelsh: sessionData.isWelsh,
    errors: recovered.errors
  })
}
