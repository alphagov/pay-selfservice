'use strict'

const logger = require('winston')

// Local dependencies
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')

module.exports = (req, res) => {
  productsClient.product.disable(req.params.productExternalId)
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
