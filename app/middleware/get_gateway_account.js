'use strict'

const _ = require('lodash')
const logger = require('../utils/logger')(__filename)
const auth = require('../services/auth_service.js')
const Connector = require('../services/clients/connector_client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)
const directDebitConnectorClient = require('../services/clients/direct_debit_connector_client.js')

module.exports = function (req, res, next) {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const params = {
    gatewayAccountId: accountId,
    correlationId: req.correlationId
  }
  if (directDebitConnectorClient.isADirectDebitAccount(accountId)) {
    return directDebitConnectorClient.gatewayAccount.get(params)
      .then(gatewayAccount => {
        req.account = gatewayAccount
        next()
      })
      .catch(err => {
        logger.error(`${req.correlationId} - Error when attempting to retrieve direct debit gateway account: ${err}`)
        next()
      })
  }

  return connectorClient.getAccount(params)
    .then(data => {
      req.account = _.extend({}, data, {
        supports3ds: ['worldpay', 'stripe', 'epdq', 'smartpay'].includes(_.get(data, 'payment_provider')),
        disableToggle3ds: _.get(data, 'payment_provider') === 'stripe'
      })
      if (req.account.payment_provider === 'stripe' && req.account.type === 'live') {
        return connectorClient.getStripeAccountSetup(accountId, req.correlationId)
      }
    })
    .then((accountSetupDetails = null) => {
      if (accountSetupDetails) {
        req.account.accountSetupDetails = accountSetupDetails
      }
      next()
    })
    .catch(err => {
      logger.error(`${req.correlationId} - Error when attempting to retrieve card gateway account: ${err}`)
      next()
    })
}
