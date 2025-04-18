'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const supportedLanguage = require('@models/constants/supported-language')

module.exports = function showEditReferencePage (req, res, next) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')

    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }

  const recovered = sessionData.referencePageRecovered || {}
  delete sessionData.referencePageRecovered

  const self = formatAccountPathsFor(paths.account.paymentLinks.manage.editReference, req.account && req.account.external_id, productExternalId)
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
