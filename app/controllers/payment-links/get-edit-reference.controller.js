'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')
const supportedLanguage = require('../../models/supported-language')

module.exports = function showEditReferencePage (req, res, next) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(paths.paymentLinks.manage.index)
  }

  const recovered = sessionData.referencePageRecovered || {}
  delete sessionData.referencePageRecovered

  const self = formattedPathFor(paths.paymentLinks.manage.editReference, productExternalId)
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
