'use strict'

// Local dependencies
const paths = require('../../paths')
const { ConnectorClient } = require('../../services/clients/connector_client')
const auth = require('../../services/auth_service')
const { CORRELATION_HEADER } = require('../../utils/correlation_header.js')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  const correlationId = req.headers[CORRELATION_HEADER] || ''

  console.log(ConnectorClient)
  const patch = {'op': 'replace', 'path': 'allow_google_pay', 'value': 'true'}
  const args = {
    gatewayAccountId,
    correlationId,
    payload: patch
  }
  console.log(args)
  connector.toggleGooglePayEnabled({
    gatewayAccountId,
    correlationId,
    payload: patch
  }, (success) => {
    console.log(success)
  })

  return res.redirect(paths.digitalWallet.summary)
}
