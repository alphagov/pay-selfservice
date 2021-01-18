'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const supportedLanguage = require('../../models/supported-language')

module.exports = function showEditInformationPage (req, res, next) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')

    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }

  const recovered = sessionData.informationPageRecovered || {}
  delete sessionData.informationPageRecovered

  const self = formatAccountPathsFor(paths.account.paymentLinks.manage.editInformation, req.account && req.account.external_id, productExternalId)
  const change = lodash.get(req, 'query.field', {})
  const paymentLinkTitle = recovered.name || sessionData.name
  const paymentLinkDescription = recovered.description || sessionData.description
  const isWelsh = sessionData.language === supportedLanguage.WELSH

  const pageData = {
    self,
    change,
    paymentLinkTitle,
    paymentLinkDescription,
    isWelsh,
    errors: recovered.errors
  }
  return response(req, res, 'payment-links/edit-information', pageData)
}
