'use strict'

// Local dependencies
const ConnectorClient = require('../../services/clients/connector_client').ConnectorClient
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { renderErrorView } = require('../../utils/response')
const paths = require('../../paths')

module.exports = (req, res, next) => {
  if (!req.account) {
    renderErrorView(req, res, 'Internal server error')
    return
  }

  connector.getStripeAccountSetup(req.account.gateway_account_id, req.correlationId).then(stripeSetupResponse => {
    if (stripeSetupResponse.bankAccount) {
      req.flash('genericError', 'Bank details flag already set')
      res.redirect(303, paths.dashboard.index)
    } else {
      next()
    }
  }).catch(() => {
    renderErrorView(req, res, 'Please try again or contact support team')
  })
}
