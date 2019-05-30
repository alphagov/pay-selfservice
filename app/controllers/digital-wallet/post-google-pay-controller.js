'use strict'

// Local dependencies
const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector_client')
const { CORRELATION_HEADER } = require('../../utils/correlation_header')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const enable = req.body['google-pay'] === 'on'

  try {
    await connector.toggleGooglePay(gatewayAccountId, enable, correlationId)

    req.flash('generic', `<h2>Google Pay successfully ${enable ? 'enabled' : 'disabled'}.</h2>`)
    return res.redirect(paths.digitalWallet.googlePay)
  } catch (error) {
    req.flash('genericError', `<h2>Something went wrong</h2>`)
    return renderErrorView(req, res, false, error.errorCode)
  }
}
