'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const auth = require('../../services/auth.service.js')
const { renderErrorView } = require('../../utils/response.js')
const formattedPathFor = require('../../utils/replace-params-in-path')
const supportedLanguage = require('../../models/supported-language')

module.exports = (req, res) => {
  const pageData = {
    create: paths.paymentLinks.start,
    manage: paths.paymentLinks.manage,
    self: formattedPathFor(paths.paymentLinks.editAmount, req.params.productExternalId)
  }
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  pageData.change = lodash.get(req, 'query.field', {})

  productsClient.product.getByProductExternalId(gatewayAccountId, req.params.productExternalId)
    .then(product => {
      const editPaymentLinkData = lodash.get(req, 'session.editPaymentLinkData', {})
      pageData.product = lodash.merge(product, editPaymentLinkData)
      pageData.amountType = product.price ? 'fixed' : 'variable'
      pageData.isWelsh = product.language === supportedLanguage.WELSH
      return response(req, res, 'payment-links/edit-amount', pageData)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Get ADHOC product by gateway account id failed - ${err.message}`)
      renderErrorView(req, res, 'Internal server error')
    })
}
