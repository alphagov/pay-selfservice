'use strict'

// Local dependencies
const paths = require('../../paths')
const { ConnectorClient } = require('../../services/clients/connector_client')
const { CORRELATION_HEADER } = require('../../utils/correlation_header.js')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const gatewayMerchantId = req.body.merchantId
  const enableGooglePayBoolean = connector.toggleGooglePay(gatewayAccountId, true, correlationId)
  const setGatewayMerchantId = connector.setGatewayMerchantId(gatewayAccountId, gatewayMerchantId, correlationId)

  Promise.all([setGatewayMerchantId, enableGooglePayBoolean]).then(() => {
    req.flash('generic', '<h2>Google Pay successfully enabled.</h2>')
    return res.redirect(paths.digitalWallet.summary)
  }).catch(err => {
    req.flash('genericError', `<h2>Something went wrong</h2><p>${err}</p>`)
    return res.redirect(paths.digitalWallet.confirmGooglePay)
  })
}
