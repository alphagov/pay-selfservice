'use strict'

const paths = require('../../../paths')
const logger = require('../../../utils/logger')(__filename)
const { response, renderErrorView } = require('../../../utils/response')
const { ConnectorClient } = require('../../../services/clients/connector_client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async (req, res) => {
  try {
    const stripeAccountSetup = await connectorClient.getStripeAccountSetup(
      req.account.gateway_account_id, req.correlationId)

    if (!stripeAccountSetup.bankAccount) {
      res.redirect(303, paths.stripeSetup.bankDetails)
    } else if (!stripeAccountSetup.responsiblePerson) {
      res.redirect(303, paths.stripeSetup.responsiblePerson)
    } else if (!stripeAccountSetup.vatNumber) {
      res.redirect(303, paths.stripeSetup.vatNumber)
    } else if (!stripeAccountSetup.companyNumber) {
      res.redirect(303, paths.stripeSetup.companyNumber)
    } else {
      response(req, res, 'stripe-setup/go-live-complete')
    }
  } catch (error) {
    logger.error(`${req.correlationId} error with Stripe > Add PSP account details : ${error}`)
    return renderErrorView(req, res, false, error.errorCode)
  }
}
