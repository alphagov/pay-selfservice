'use strict'

// NPM dependencies
const logger = require('winston')
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const auth = require('../../services/auth_service.js')
const errorView = require('../../utils/response.js').renderErrorView
const formattedPathFor = require('../../utils/replace_params_in_path')

module.exports = (req, res) => {
  const PAGE_PARAMS = {
    create: paths.paymentLinks.start,
    manage: paths.paymentLinks.manage,
    self: formattedPathFor(paths.paymentLinks.editInformation, req.params.productExternalId)
  }
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  PAGE_PARAMS.change = lodash.get(req, 'query.field', {})

  productsClient.product.getByProductExternalId(gatewayAccountId, req.params.productExternalId)
    .then(product => {
      const editPaymentLinkData = lodash.get(req, 'session.editPaymentLinkData', {})
      PAGE_PARAMS.product = lodash.merge(product, editPaymentLinkData)
      return response(req, res, 'payment-links/edit-information', PAGE_PARAMS)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Get ADHOC product by gateway account id failed - ${err.message}`)
      errorView(req, res, 'Internal server error')
    })
}
