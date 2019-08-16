'use strict'

// NPM dependencies
const { createLogger, format } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  )
})

// Local dependencies
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
