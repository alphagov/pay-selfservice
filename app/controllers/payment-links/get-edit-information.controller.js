'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')
const supportedLanguage = require('../../models/supported-language')

module.exports = function showEditInformationPage (req, res, next) {
  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData) {
    return next(new Error('Edit payment link data not found in session cookie'))
  }

  const recovered = sessionData.informationPageRecovered || {}
  delete sessionData.informationPageRecovered

  const self = formattedPathFor(paths.paymentLinks.editInformation, req.params.productExternalId)
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
