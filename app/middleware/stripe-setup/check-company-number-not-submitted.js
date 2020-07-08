'use strict'

// Local dependencies
const { ConnectorClient } = require('../../services/clients/connector_client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { renderErrorView } = require('../../utils/response')
const paths = require('../../paths')

module.exports = function checkCompanyNumberNotSubmitted (req, res, next) {
  if (!req.account) {
    renderErrorView(req, res, 'Internal server error')
    return
  }

  connector.getStripeAccountSetup(req.account.gateway_account_id, req.correlationId).then(stripeSetupResponse => {
    if (stripeSetupResponse.companyNumber) {
      req.flash('genericError', 'You’ve already provided your company registration number.<br />Contact GOV.UK Pay support if you need to update it.')
      res.redirect(303, paths.dashboard.index)
    } else {
      next()
    }
  }).catch(() => {
    renderErrorView(req, res, 'Please try again or contact support team')
  })
}
