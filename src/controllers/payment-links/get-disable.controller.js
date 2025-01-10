'use strict'

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const productsClient = require('../../services/clients/products.client.js')

module.exports = async (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id

  try {
    await productsClient.product.disable(gatewayAccountId, req.params.productExternalId)
    req.flash('generic', 'The payment link was successfully deleted')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  } catch (err) {
    logger.error(`Disable product failed - ${err.message}`)
    req.flash('genericError', 'Something went wrong when deleting the payment link. Please try again or contact support.')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }
}
