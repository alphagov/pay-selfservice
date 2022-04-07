'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')

module.exports = function showAmountPage (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    return next(new Error('Payment link data not found in session cookie'))
  }

  const recovered = sessionData.amountPageRecovered || {}
  delete sessionData.amountPageRecovered

  const amountInPence = recovered.amount || sessionData.paymentLinkAmount || ''
  const amountType = recovered.type || sessionData.paymentAmountType || ''

  return response(req, res, 'payment-links/amount', {
    amountInPence,
    amountType,
    isWelsh: sessionData.isWelsh,
    errors: recovered.errors,
    isEditing: false
  })
}
