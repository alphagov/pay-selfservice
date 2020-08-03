'use strict'

// Local dependencies
const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')

module.exports = async (req, res) => {
  const connector = new ConnectorClient(process.env.CONNECTOR_URL)
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = req.account.gateway_account_id

  const enable = req.body['three-dee-secure'] === 'on'

  try {
    const params = {
      gatewayAccountId: accountId,
      payload: {
        toggle_3ds: enable
      },
      correlationId: correlationId
    }

    await connector.update3dsEnabled(params)
    req.flash('generic', '3D secure settings have been updated')
    return res.redirect(paths.toggle3ds.index)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}
