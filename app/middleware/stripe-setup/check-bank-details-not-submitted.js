'use strict'

// Local dependencies
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { renderErrorView } = require('../../utils/response')
const paths = require('../../paths')

module.exports = function checkBankDetailsNotSubmitted (req, res, next) {
  if (!req.account) {
    renderErrorView(req, res, 'Internal server error')
    return
  }

  connector.getStripeAccountSetup(req.account.gateway_account_id, req.correlationId).then(stripeSetupResponse => {
    if (stripeSetupResponse.bankAccount) {
      req.flash('genericError', 'You’ve already provided your bank details.<br />Contact GOV.UK Pay support if you need to update them.')
      res.redirect(303, paths.dashboard.index)
    } else {
      next()
    }
  }).catch(() => {
    renderErrorView(req, res, 'Please try again or contact support team')
  })
}
