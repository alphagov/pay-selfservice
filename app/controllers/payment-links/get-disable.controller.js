'use strict'

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const auth = require('../../services/auth.service.js')

module.exports = async (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)

  try {
    await productsClient.product.disable(gatewayAccountId, req.params.productExternalId)
    req.flash('generic', 'The payment link was successfully deleted')
    return res.redirect(paths.paymentLinks.manage.index)
  } catch (err) {
    logger.error(`[requestId=${req.correlationId}] Disable product failed - ${err.message}`)
    req.flash('genericError', 'Something went wrong when deleting the payment link. Please try again or contact support.')
    return res.redirect(paths.paymentLinks.manage.index)
  }
}
