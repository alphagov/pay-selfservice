'use strict'

// Local dependencies
const paths = require('../../paths')
const { ConnectorClient } = require('../../services/clients/connector_client')
const { CORRELATION_HEADER } = require('../../utils/correlation_header.js')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id
  const correlationId = req.headers[CORRELATION_HEADER] || ''

  connector.toggleApplePay(gatewayAccountId, true, correlationId).then(() => {
    req.flash('generic', '<h2>Apple Pay successfully enabled.</h2>')
    return res.redirect(paths.digitalWallet.summary)
  }).catch(err => {
    req.flash('genericError', `<h2>Something went wrong</h2><p>${err}</p>`)
    return res.redirect(paths.digitalWallet.confirmApplePay)
  })
}
