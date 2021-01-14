'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const enable = req.body['apple-pay'] === 'on'
  const formattedPath = formatAccountPathsFor(paths.account.digitalWallet.applePay, req.account && req.account.external_id)

  try {
    await connector.toggleApplePay(gatewayAccountId, enable, correlationId)

    req.flash('generic', `Apple Pay successfully ${enable ? 'enabled' : 'disabled'}.`)
    return res.redirect(formattedPath)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}
