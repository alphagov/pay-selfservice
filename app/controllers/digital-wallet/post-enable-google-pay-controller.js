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
  const setGatewayMerchantIdPayload = { 'op': 'add', 'path': 'credentials/gateway_merchant_id', 'value': gatewayMerchantId }

  const enableGooglePayBoolean = connector.toggleGooglePayEnabled({
    gatewayAccountId,
    correlationId,
    payload: enableGooglePayPayload
  })

  const setGatewayMerchantID = connector.toggleGooglePayEnabled({
    gatewayAccountId,
    correlationId,
    payload: setGatewayMerchantIdPayload
  })

  Promise.all([enableGooglePayBoolean, setGatewayMerchantID]).then(toggleGooglePayResponse => {
    req.flash('generic', '<h2>Google Pay successfully enabled.</h2>')
    return res.redirect(paths.digitalWallet.summary)
  }).catch(err => {
    req.flash('genericError', `<h2>Something went wrong</h2><p>${err.message.errors.join(', ')}</p>`)
    return res.redirect(paths.digitalWallet.confirmGooglePay)
  })
}
