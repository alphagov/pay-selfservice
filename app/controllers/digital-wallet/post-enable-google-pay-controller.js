'use strict'

// Local dependencies
const paths = require('../../paths')
const { ConnectorClient } = require('../../services/clients/connector_client')
const auth = require('../../services/auth_service')
const { CORRELATION_HEADER } = require('../../utils/correlation_header.js')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const gatewayMerchantId = req.body.merchantId
  const enableGooglePayPayload = { 'op': 'replace', 'path': 'allow_google_pay', 'value': 'true' }
  connector.toggleGooglePayEnabled({
    gatewayAccountId,
    correlationId,
    payload: enableGooglePayPayload
  }, (success) => {
    console.log(success)
  })

  const setGatewayMerchantIdPayload = { 'op': 'add', 'path': 'credentials/gateway_merchant_id', 'value': gatewayMerchantId }
  connector.toggleGooglePayEnabled({
    gatewayAccountId,
    correlationId,
    payload: setGatewayMerchantIdPayload
  }, (success) => {
    console.log(success)
  })

  return res.redirect(paths.digitalWallet.summary)
}
