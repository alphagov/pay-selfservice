const auth = require('../services/auth_service.js')
const Connector = require('../services/clients/connector_client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)
const directDebitConnectorClient = require('../services/clients/direct_debit_connector_client.js')
const _ = require('lodash')
const winston = require('winston')

module.exports = function (req, res, next) {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const params = {
    gatewayAccountId: accountId,
    correlationId: req.correlationId
  }
  if (accountId.startsWith(directDebitConnectorClient.DIRECT_DEBIT_TOKEN_PREFIX)) {
    return directDebitConnectorClient.gatewayAccount.get(params)
      .then(gatewayAccount => {
        req.account = gatewayAccount
        next()
      })
      .catch(err => {
        winston.error(`${req.correlationId} - Error when attempting to retrieve direct debit gateway account: ${err}`)
        next()
      })
  }
  return connectorClient.getAccount(params)
    .then(data => {
      req.account = _.extend({}, data, {
        supports3ds: _.get(data, 'payment_provider') === 'worldpay'
      })
      next()
    })
    .catch(err => {
      winston.error(`${req.correlationId} - Error when attempting to retrieve card gateway account: ${err}`)
      next()
    })
}
