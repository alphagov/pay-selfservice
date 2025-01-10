'use strict'

const logger = require('../../utils/logger')(__filename)
const productsClient = require('../../services/clients/products.client.js')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const router = require('../../routes')

module.exports = async function goToTransactions (req, res, next) {
  const productExternalId = req.params.productExternalId
  try {
    const product = await productsClient.product.getProductByExternalId(productExternalId)
    const account = await connector.getAccount({ gatewayAccountId: product.gatewayAccountId })
    res.redirect(302, formatAccountPathsFor(router.paths.account.transactions.index, account.external_id))
  } catch (err) {
    logger.error(`Failed to redirect demo payment to transactions - ${err.message}`)
    next(err)
  }
}
