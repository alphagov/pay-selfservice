'use strict'

const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')

const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async function toggleMaskCardNumber (req, res) {
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = req.account.gateway_account_id
  const enableMaskCardNumber = req.body['moto-mask-card-number-input-toggle'] === 'on'

  try {
    await connector.toggleMotoMaskCardNumberInput(accountId, enableMaskCardNumber, correlationId)

    req.flash('generic', 'Your changes have saved')
    return res.redirect(paths.toggleMotoMaskCardNumberAndSecurityCode.cardNumber)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}
