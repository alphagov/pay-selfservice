'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response.js')

module.exports = function showReferencePage (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    next(new Error('Payment link data not found in session cookie'))
  }

  const recovered = sessionData.referencePageRecovered || {}
  delete sessionData.referencePageRecovered

  const paymentReferenceType = recovered.type || sessionData.paymentReferenceType || ''
  const paymentReferenceLabel = recovered.label || sessionData.paymentReferenceLabel || ''
  const paymentReferenceHint = recovered.hint || sessionData.paymentReferenceHint || ''

  const change = lodash.get(req, 'query.change', {})

  return response(req, res, 'payment-links/reference', {
    change,
    paymentReferenceType,
    paymentReferenceLabel,
    paymentReferenceHint,
    isWelsh: sessionData.isWelsh,
    errors: recovered.errors
  })
}
