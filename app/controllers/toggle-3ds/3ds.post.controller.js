'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async function submit3dsSettings (req, res, next) {
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
    return res.redirect(formatAccountPathsFor(paths.account.toggle3ds.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}
