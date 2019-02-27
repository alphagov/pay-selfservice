'use strict'

// Local dependencies
const response = require('../../../utils/response')
const ConnectorClient = require('../../../services/clients/connector_client').ConnectorClient
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../../../paths')

module.exports = (req, res) => {
  if (req.account.payment_provider.toLowerCase() !== 'stripe' ||
    req.account.type.toLowerCase() !== 'live') {
    res.status(404)
    res.render('404')
    return
  }

  connector.getStripeAccountSetup(req.account.gateway_account_id, req.correlationId).then(stripeSetupResponse => {
    if (stripeSetupResponse.bankAccount) {
      req.flash('genericError', 'Bank details flag already set')
      return res.redirect(303, paths.dashboard.index)
    }
    return response.response(req, res, 'stripe-setup/bank-details/index')
  })
}
