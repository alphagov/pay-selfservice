'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  const paymentReferenceType = req.body['reference-type-group'] || pageData.paymentReferenceType || ''
  const paymentReferenceLabel = req.body['reference-label'] || pageData.paymentReferenceLabel || ''
  const paymentReferenceHint = req.body['reference-hint-text'] || pageData.paymentReferenceHint || ''
  const isWelsh = pageData.isWelsh

  const change = lodash.get(req, 'query.change', {})

  return response(req, res, 'payment-links/reference', {
    change,
    paymentReferenceType,
    paymentReferenceLabel,
    paymentReferenceHint,
    isWelsh
  })
}
