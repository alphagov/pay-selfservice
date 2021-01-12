'use strict'

const _ = require('lodash')
const logger = require('../utils/logger')(__filename)
const auth = require('../services/auth.service.js')
const Connector = require('../services/clients/connector.client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)

module.exports = function (req, res, next) {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const params = {
    gatewayAccountId: accountId,
    correlationId: req.correlationId
  }

  return connectorClient.getAccount(params)
    .then(data => {
      req.account = _.extend({}, data, {
        supports3ds: ['worldpay', 'stripe', 'epdq', 'smartpay'].includes(_.get(data, 'payment_provider')),
        disableToggle3ds: _.get(data, 'payment_provider') === 'stripe'
      })
      if (req.account.payment_provider === 'stripe') {
        return connectorClient.getStripeAccountSetup(accountId, req.correlationId)
      }
    })
    .then((connectorGatewayAccountStripeProgress = null) => {
      if (connectorGatewayAccountStripeProgress) {
        req.account.connectorGatewayAccountStripeProgress = connectorGatewayAccountStripeProgress
      }
      next()
    })
    .catch(err => {
      logger.error(`${req.correlationId} - Error when attempting to retrieve card gateway account: ${err}`)
      next()
    })
}
