'use strict'

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const publicAuthClient = require('../../services/clients/public-auth.client.js')
const auth = require('../../services/auth.service.js')

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  productsClient.product.getByProductExternalId(gatewayAccountId, req.params.productExternalId)
    .then(product => {
      const deleteToken = publicAuthClient.deleteTokenForAccount({
        accountId: gatewayAccountId,
        correlationId: req.correlationId,
        payload: {
          token: product.apiToken
        }
      })
      const deleteProduct = productsClient.product.delete(gatewayAccountId, req.params.productExternalId)
      return Promise.all([
        deleteToken,
        deleteProduct
      ])
        .then(() => {
          req.flash('generic', 'The payment link was successfully deleted')
          res.redirect(paths.paymentLinks.manage.index)
        })
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Delete product failed - ${err.message}`)
      req.flash('genericError', 'Something went wrong when deleting the payment link. Please try again or contact support.')
      res.redirect(paths.paymentLinks.manage.index)
    })
}
