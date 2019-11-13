'use strict'

// Local dependencies
const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector_client')
const { correlationHeader } = require('../../utils/correlation_header')

module.exports = async (req, res) => {
  const connector = new ConnectorClient(process.env.CONNECTOR_URL)
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = req.account.gateway_account_id

  try {
    const params = {
      correlationId: correlationId,
      gatewayAccountId: accountId,
      payload: {
        organisational_unit_id: req.body['organisational-unit-id'],
        issuer: req.body.issuer,
        jwt_mac_key: req.body['jwt-mac-key']
      }
    }

    await connector.post3dsFlexAccountCredentials(params)
    req.flash('generic', 'Your Worldpay 3DS Flex settings have been updated')
    return res.redirect(paths.yourPsp.index)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}
