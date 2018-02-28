'use strict'

// NPM dependencies
const logger = require('winston')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const authService = require('../../services/auth_service.js')
const errorView = require('../../utils/response.js').renderErrorView

const PAGE_PARAMS = {
  returnToStart: paths.paymentLinks.start,
  manage: paths.paymentLinks.manage
}

module.exports = (req, res) => {
  productsClient.product.disable(req.params.productExternalId)
    .then(() => {
      req.flash('generic', '<p>The payment link was successfully deleted</p>')
      res.redirect(paths.paymentLinks.manage)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Disable product failed - ${err.message}`)
      req.flash('genericError', '<p>Unable to delete the payment link</p>')
      res.redirect(paths.paymentLinks.manage)
    })
}
