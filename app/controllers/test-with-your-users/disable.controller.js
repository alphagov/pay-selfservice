'use strict'

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const auth = require('../../services/auth.service.js')

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  productsClient.product.disable(gatewayAccountId, req.params.productExternalId)
    .then(() => {
      req.flash('generic', '<p>Prototype link deleted</p>')
      res.redirect(paths.prototyping.demoService.links)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Disable product failed - ${err.message}`)
      req.flash('genericError', '<p>Unable to delete prototype link</p>')
      res.redirect(paths.prototyping.demoService.links)
    })
}
