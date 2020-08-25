'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response')
const supportedLanguage = require('../../models/supported-language')

module.exports = function showInformationPage (req, res) {
  // initialise session for create payment link journey if it doesn't exist
  if (!lodash.get(req, 'session.pageData.createPaymentLink')) {
    lodash.set(req, 'session.pageData.createPaymentLink', {})
  }

  const sessionData = req.session.pageData.createPaymentLink
  if (!sessionData.hasOwnProperty('isWelsh')) {
    sessionData.isWelsh = lodash.get(req, 'query.language') === supportedLanguage.WELSH
  }

  const recovered = sessionData.informationPageRecovered || {}
  delete sessionData.informationPageRecovered

  const paymentLinkTitle = recovered.title || sessionData.paymentLinkTitle || ''
  const paymentLinkDescription = recovered.description || sessionData.paymentLinkDescription || ''
  const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI

  const change = lodash.get(req, 'query.field', {})

  const language = sessionData.isWelsh ? supportedLanguage.WELSH : supportedLanguage.ENGLISH
  const serviceName = req.service.serviceName[language] || req.service.serviceName.en

  return response(req, res, 'payment-links/information', {
    change,
    friendlyURL,
    paymentLinkTitle,
    paymentLinkDescription,
    isWelsh: sessionData.isWelsh,
    serviceName,
    errors: recovered.errors
  })
}
