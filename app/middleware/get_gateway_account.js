'use strict'

// npm dependencies
const _ = require('lodash')
const winston = require('winston')
const AWSXRay = require('aws-xray-sdk')
const getNamespace = require('continuation-local-storage').getNamespace

// local dependencies
const auth = require('../services/auth_service.js')
const Connector = require('../services/clients/connector_client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)
const directDebitConnectorClient = require('../services/clients/direct_debit_connector_client.js')

// constants
const EPDQ_3DS_ENABLED = process.env.EPDQ_3DS_ENABLED
const SMARTPAY_3DS_ENABLED = process.env.SMARTPAY_3DS_ENABLED || 'false'

// Constants
const clsXrayConfig = require('../../config/xray-cls')

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

  const namespace = getNamespace(clsXrayConfig.nameSpaceName)
  const clsSegment = namespace.get(clsXrayConfig.segmentKeyName)

  AWSXRay.captureAsyncFunc('connectorClient_getAccount', function (subsegment) {
    return connectorClient.getAccount(params)
      .then(data => {
        subsegment.close()
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
        subsegment.close(err)
        winston.error(`${req.correlationId} - Error when attempting to retrieve card gateway account: ${err}`)
        next()
      })
  }, clsSegment)
}
