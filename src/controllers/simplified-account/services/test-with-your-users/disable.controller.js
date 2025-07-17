'use strict'

const logger = require('@utils/logger')(__filename)
const paths = require('../../../../paths')
const productsClient = require('@services/clients/products.client.js')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')

module.exports = (req, res) => {
  productsClient.product.disable(req.account.id, req.params.productExternalId)
    .then(() => {
      req.flash('generic', 'Prototype link deleted')
      res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type))
    })
    .catch((err) => {
      logger.error(`Disable product failed - ${err.message}`)
      req.flash('genericError', 'Something went wrong when deleting the prototype link. Please try again or contact support.')
      res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type))
    })
}
