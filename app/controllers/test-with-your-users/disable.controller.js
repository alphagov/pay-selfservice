'use strict'

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')

module.exports = (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id
  productsClient.product.disable(gatewayAccountId, req.params.productExternalId)
    .then(() => {
      req.flash('generic', 'Prototype link deleted')
      res.redirect(paths.prototyping.demoService.links)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Disable product failed - ${err.message}`)
      req.flash('genericError', 'Something went wrong when deleting the prototype link. Please try again or contact support.')
      res.redirect(paths.prototyping.demoService.links)
    })
}
