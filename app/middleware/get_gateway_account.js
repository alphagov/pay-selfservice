const auth = require('../services/auth_service.js')
const Connector = require('../services/clients/connector_client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)
const directDebitConnectorClient = require('../services/clients/direct_debit_connector_client.js')
const _ = require('lodash')
const winston = require('winston')
const EPDQ_3DS_ENABLED = process.env.EPDQ_3DS_ENABLED
const SMARTPAY_3DS_ENABLED = process.env.SMARTPAY_3DS_ENABLED || 'false'

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
        winston.error(`${req.correlationId} - Error when attempting to retrieve direct debit gateway account: ${err}`)
        next()
      })
  }
  return connectorClient.getAccount(params)
    .then(data => {
      let SUPPORTS_3DS = ['worldpay']
      // env var values are treated as text so the comparison is done for text
      if (EPDQ_3DS_ENABLED === 'true') {
        SUPPORTS_3DS = _.concat(SUPPORTS_3DS, ['epdq'])
      }
      if (SMARTPAY_3DS_ENABLED === 'true') {
        SUPPORTS_3DS = _.concat(SUPPORTS_3DS, ['smartpay'])
      }
      req.account = _.extend({}, data, {
        supports3ds: SUPPORTS_3DS.includes(_.get(data, 'payment_provider'))
      })
      next()
    })
    .catch(err => {
      winston.error(`${req.correlationId} - Error when attempting to retrieve card gateway account: ${err}`)
      next()
    })
}
