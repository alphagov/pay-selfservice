'use strict'

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const auth = require('../../services/auth_service.js')

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  productsClient.product.disable(gatewayAccountId, req.params.productExternalId)
    .then(() => {
      req.flash('generic', '<h2>The payment link was successfully deleted</h2>')
      res.redirect(paths.paymentLinks.manage)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Disable product failed - ${err.message}`)
      req.flash('genericError', '<h2>There were errors</h2><p>Unable to delete the payment link</p>')
      res.redirect(paths.paymentLinks.manage)
    })
}
