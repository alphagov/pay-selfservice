'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')

const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async function toggleMaskCardNumber (req, res, next) {
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = req.account.gateway_account_id
  const enableMaskCardNumber = req.body['moto-mask-card-number-input-toggle'] === 'on'

  try {
    await connector.toggleMotoMaskCardNumberInput(accountId, enableMaskCardNumber, correlationId)

    req.flash('generic', 'Your changes have saved')
    return res.redirect(formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}
