'use strict'

// NPM dependencies
const { createLogger, format, transports } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.Console()
  ]
})
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response')
const productsClient = require('../../services/clients/products_client')
const authService = require('../../services/auth_service')
const { renderErrorView } = require('../../utils/response')
const supportedLanguage = require('../../models/supported-language')

module.exports = (req, res) => {
  lodash.unset(req, 'session.editPaymentLinkData')

  productsClient.product.getByGatewayAccountId(authService.getCurrentGatewayAccountId(req))
    .then(products => {
      const paymentLinks = products.filter(product => product.type === 'ADHOC')
      const englishPaymentLinks = paymentLinks.filter(link => link.language === supportedLanguage.ENGLISH)
      const welshPaymentLinks = paymentLinks.filter(link => link.language === supportedLanguage.WELSH)
      const pageData = {
        productsLength: paymentLinks.length,
        englishPaymentLinks,
        welshPaymentLinks
      }
      return response(req, res, 'payment-links/manage', pageData)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Get ADHOC product by gateway account id failed - ${err.message}`)
      renderErrorView(req, res)
    })
}
