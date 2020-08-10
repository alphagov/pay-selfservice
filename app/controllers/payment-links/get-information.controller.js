'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response')
const supportedLanguage = require('../../models/supported-language')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  const paymentLinkTitle = req.body['payment-description'] || pageData.paymentLinkTitle || ''
  const paymentLinkDescription = req.body['payment-amount'] || pageData.paymentLinkDescription || ''
  const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI

  const change = lodash.get(req, 'query.field', {})

  let isWelsh
  if (pageData.hasOwnProperty('isWelsh')) {
    isWelsh = pageData.isWelsh
  } else {
    isWelsh = lodash.get(req, 'query.language') === supportedLanguage.WELSH
    lodash.set(req, 'session.pageData.createPaymentLink', {
      ...pageData,
      isWelsh
    })
  }

  const language = isWelsh ? supportedLanguage.WELSH : supportedLanguage.ENGLISH
  const serviceName = req.service.serviceName[language] || req.service.serviceName.en

  return response(req, res, 'payment-links/information', {
    change,
    friendlyURL,
    paymentLinkTitle,
    paymentLinkDescription,
    isWelsh,
    serviceName
  })
}
