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

  const paymentReferenceType = recovered.type || sessionData.paymentReferenceType || ''
  const paymentReferenceLabel = recovered.label || sessionData.paymentReferenceLabel || ''
  const paymentReferenceHint = recovered.hint || sessionData.paymentReferenceHint || ''
  const govUkFormsUrl = recovered.govUkFormsUrl || sessionData.govUkFormsUrl || ''

  const change = lodash.get(req, 'query.change', {})

  return response(req, res, 'payment-links/reference', {
    change,
    paymentReferenceType,
    paymentReferenceLabel,
    paymentReferenceHint,
    govUkFormsUrl,
    isWelsh: sessionData.isWelsh,
    errors: recovered.errors
  })
}
