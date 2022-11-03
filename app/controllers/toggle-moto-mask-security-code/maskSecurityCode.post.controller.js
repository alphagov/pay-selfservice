'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { ConnectorClient } = require('../../services/clients/connector.client')

const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async function toggleMaskCardSecurityCode (req, res, next) {
  const accountId = req.account.gateway_account_id
  const enableMaskSecurityCode = req.body['moto-mask-security-code-input-toggle'] === 'on'

  try {
    await connector.toggleMotoMaskSecurityCodeInput(accountId, enableMaskSecurityCode)

    req.flash('generic', 'Your changes have saved')
    return res.redirect(formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}
