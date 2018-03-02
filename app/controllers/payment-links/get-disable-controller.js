'use strict'

// NPM dependencies
const logger = require('winston')

// Local dependencies
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')

module.exports = (req, res) => {
  productsClient.product.disable(req.params.productExternalId)
    .then(() => {
      req.flash('generic', '<h2>The payment link was successfully deleted</h2><p>It will no longer be accessible</p>')
      res.redirect(paths.paymentLinks.manage)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Disable product failed - ${err.message}`)
      req.flash('genericError', '<h2>There were errors</h2><p>Unable to delete the payment link</p>')
      res.redirect(paths.paymentLinks.manage)
    })
}
