'use strict'

const paths = require('../../../paths')
const { response } = require('../../../utils/response')
const { ConnectorClient } = require('../../../services/clients/connector_client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async (req, res) => {
  const stripeAccountSetup = await connectorClient.getStripeAccountSetup(
    req.account.gateway_account_id, req.correlationId)

  if (!stripeAccountSetup.bankAccount) {
    res.redirect(303, paths.stripeSetup.bankDetails)
  } else if (!stripeAccountSetup.responsiblePerson) {
    res.redirect(303, paths.stripeSetup.responsiblePerson)
  } else if (!stripeAccountSetup.vatNumberCompanyNumber) {
    res.redirect(303, paths.stripeSetup.vatNumberCompanyNumber)
  } else {
    response(req, res, 'stripe-setup/go-live-complete')
  }
}
