'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')

module.exports = function showReferencePage (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    return next(new Error('Payment link data not found in session cookie'))
  }

  const recovered = sessionData.referencePageRecovered || {}
  delete sessionData.referencePageRecovered

  const referenceEnabled = recovered.referenceEnabled || sessionData.referenceEnabled || ''
  const referenceLabel = recovered.referenceLabel || sessionData.paymentReferenceLabel || ''
  const referenceHint = recovered.referenceHint || sessionData.paymentReferenceHint || ''

  const change = lodash.get(req, 'query.change', {})

  return response(req, res, 'payment-links/reference', {
    change,
    referenceEnabled,
    referenceLabel,
    referenceHint,
    isWelsh: sessionData.isWelsh,
    errors: recovered.errors
  })
}
