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
  const formattedPath = formatAccountPathsFor(paths.account.toggleMotoMaskCardNumberAndSecurityCode.cardNumber, req.account && req.account.external_id)

  try {
    await connector.toggleMotoMaskCardNumberInput(accountId, enableMaskCardNumber, correlationId)

    req.flash('generic', 'Your changes have saved')
    return res.redirect(formattedPath)
  } catch (err) {
    next(err)
  }
}
