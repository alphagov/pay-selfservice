'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')
const supportedLanguage = require('../../models/supported-language')

module.exports = function showEditReferencePage (req, res, next) {
  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData) {
    return next(new Error('Edit payment link data not found in session cookie'))
  }

  const recovered = sessionData.referencePageRecovered || {}
  delete sessionData.referencePageRecovered

  const self = formattedPathFor(paths.paymentLinks.editReference, req.params.productExternalId)
  const change = lodash.get(req, 'query.field', {})
  const referenceLabel = recovered.referenceLabel || sessionData.referenceLabel
  const referenceHint = recovered.referenceHint || sessionData.referenceHint
  const referenceEnabled = recovered.referenceEnabled || sessionData.referenceEnabled
  const isWelsh = sessionData.language === supportedLanguage.WELSH

  const pageData = {
    self,
    change,
    referenceLabel,
    referenceHint,
    referenceEnabled,
    isWelsh,
    errors: recovered.errors
  }
  return response(req, res, 'payment-links/edit-reference', pageData)
}
