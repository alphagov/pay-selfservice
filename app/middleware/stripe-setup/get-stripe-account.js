'use strict'

// Local dependencies
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { renderErrorView } = require('../../utils/response')

module.exports = function getStripeAccount (req, res, next) {
  if (!req.account) {
    renderErrorView(req, res, 'Internal server error')
    return
  }

  connector.getStripeAccount(req.account.gateway_account_id, req.correlationId).then(stripeAccountResponse => {
    res.locals.stripeAccount = stripeAccountResponse
    next()
  }).catch(() => {
    renderErrorView(req, res, 'Please try again or contact support team')
  })
}
