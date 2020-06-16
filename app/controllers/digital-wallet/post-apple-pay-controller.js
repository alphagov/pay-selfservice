'use strict'

const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector_client')
const { CORRELATION_HEADER } = require('../../utils/correlation_header')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const enable = req.body['apple-pay'] === 'on'

  try {
    await connector.toggleApplePay(gatewayAccountId, enable, correlationId)

    req.flash('generic', `<h2>Apple Pay successfully ${enable ? 'enabled' : 'disabled'}.</h2>`)
    return res.redirect(paths.digitalWallet.applePay)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}
