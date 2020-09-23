'use strict'

const paths = require('../../paths')

const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')

const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async function toggleMaskCardSecurityCode (req, res) {
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = req.account.gateway_account_id
  const enableMaskSecurityCode = req.body['moto-mask-security-code-input-toggle'] === 'on'

  try {
    await connector.toggleMotoMaskSecurityCodeInput(accountId, enableMaskSecurityCode, correlationId)

    req.flash('generic', 'Your changes have saved')
    return res.redirect(paths.toggleMotoMaskCardNumberAndSecurityCode.securityCode)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}
