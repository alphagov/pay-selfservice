'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const auth = require('../../services/auth.service.js')
const { renderErrorView } = require('../../utils/response.js')

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)

  const editPaymentLinkData = lodash.get(req, 'session.editPaymentLinkData', {})
  productsClient.product.update(gatewayAccountId, req.params.productExternalId, editPaymentLinkData)
    .then(product => {
      lodash.unset(req, 'session.editPaymentLinkData')
      req.flash('generic', `<h2>Your payment link has been updated</h2>`)
      res.redirect(paths.paymentLinks.manage)
    })
    .catch((err) => {
      console.log(err)
      logger.error(`[requestId=${req.correlationId}] update of payment link failed - ${err.message}`)
      renderErrorView(req, res, 'Internal server error')
    })
}
