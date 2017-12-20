const auth = require('../services/auth_service.js')
const Connector = require('../services/clients/connector_client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)
const _ = require('lodash')

module.exports = function (req, res, next) {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const params = {
    gatewayAccountId: accountId,
    correlationId: req.correlationId
  }
  return connectorClient.getAccount(params)
    .then(data => {
      req.account = _.extend({}, data, {
        supports3ds: _.get(data, 'payment_provider') === 'worldpay'
      })
      next()
    })
    .catch((err) => {
      next()
    })
}
