'use strict'

// Local dependencies
const logger = require('winston')
const paths = require('../../paths')
const { ConnectorClient } = require('../../services/clients/connector_client')
const { CORRELATION_HEADER } = require('../../utils/correlation_header.js')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async function enableGooglePay (req, res) {
  const gatewayAccountId = req.account.gateway_account_id
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const gatewayMerchantId = req.body.merchantId
  try {
    await connector.setGatewayMerchantId(gatewayAccountId, gatewayMerchantId, correlationId)
    logger.info(`${correlationId} set google pay merchant ID for ${gatewayAccountId}`)
    await connector.toggleGooglePay(gatewayAccountId, true, correlationId)
    logger.info(`${correlationId} enabled google pay boolean for ${gatewayAccountId}`)
    req.flash('generic', '<h2>Google Pay successfully enabled.</h2>')
    return res.redirect(paths.digitalWallet.summary)
  } catch (err) {
    logger.error(`${correlationId} error enabling google pay for ${gatewayAccountId}: ${err}`)
    req.flash('genericError', `<h2>Something went wrong</h2><p>${err}</p>`)
    return res.redirect(paths.digitalWallet.confirmGooglePay)
  }
}
