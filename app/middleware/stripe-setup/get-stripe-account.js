'use strict'

const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { renderErrorView } = require('../../utils/response')

module.exports = async function getStripeAccount (req, res, next) {
  if (!req.account) {
    renderErrorView(req, res)
    return
  }

  try {
    const stripeAccountResponse = await connector.getStripeAccount(req.account.gateway_account_id, req.correlationId)
    res.locals.stripeAccount = stripeAccountResponse
    next()
  } catch (err) {
    console.log('error')
    renderErrorView(req, res)
  }
}
