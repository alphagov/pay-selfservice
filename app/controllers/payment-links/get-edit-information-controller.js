'use strict'

// NPM dependencies
const logger = require('../../utils/logger')
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const auth = require('../../services/auth_service.js')
const errorView = require('../../utils/response.js').renderErrorView
const formattedPathFor = require('../../utils/replace_params_in_path')
const supportedLanguage = require('../../models/supported-language')

module.exports = (req, res) => {
  const pageData = {
    self: formattedPathFor(paths.paymentLinks.editInformation, req.params.productExternalId)
  }
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  pageData.change = lodash.get(req, 'query.field', {})

  productsClient.product.getByProductExternalId(gatewayAccountId, req.params.productExternalId)
    .then(product => {
      const editPaymentLinkData = lodash.get(req, 'session.editPaymentLinkData', {})
      pageData.product = lodash.merge(product, editPaymentLinkData)
      pageData.isWelsh = product.language === supportedLanguage.WELSH
      return response(req, res, 'payment-links/edit-information', pageData)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Get ADHOC product by gateway account id failed - ${err.message}`)
      errorView(req, res, 'Internal server error')
    })
}
