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
    const flexParams = {
      correlationId: correlationId,
      gatewayAccountId: accountId,
      payload: {
        organisational_unit_id: req.body['organisational-unit-id'],
        issuer: req.body.issuer,
        jwt_mac_key: req.body['jwt-mac-key']
      }
    }

    // if someone is adding the flex creds, we should make sure 3DS is enabled too and if not enable it
    if (!req.account.requires3ds) {
      const threeDsParams = {
        gatewayAccountId: accountId,
        payload: {
          toggle_3ds: true
        },
        correlationId: correlationId
      }

      await connector.update3dsEnabled(threeDsParams)
    }

    await connector.post3dsFlexAccountCredentials(flexParams)
    req.flash('generic', 'Your Worldpay 3DS Flex settings have been updated')
    return res.redirect(paths.yourPsp.index)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}
