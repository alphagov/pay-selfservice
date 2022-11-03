'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async (req, res, next) => {
  const gatewayAccountId = req.account.gateway_account_id
  const enable = req.body['apple-pay'] === 'on'

  try {
    await connector.toggleApplePay(gatewayAccountId, enable)

    req.flash('generic', `Apple Pay successfully ${enable ? 'enabled' : 'disabled'}`)
    return res.redirect(formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}
