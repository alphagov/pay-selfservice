'use strict'

// Local dependencies
const baseClient = require('./base-client/base.client')
const GatewayAccount = require('../../models/DirectDebitGatewayAccount.class')

// Constants
const SERVICE_NAME = 'directdebit-connector'
const DIRECT_DEBIT_CONNECTOR_URL = process.env.DIRECT_DEBIT_CONNECTOR_URL

module.exports = function (clientOptions = {}) {
  const baseUrl = clientOptions.baseUrl || DIRECT_DEBIT_CONNECTOR_URL

  const getGatewayAccountByExternalId = (params) => {
    return baseClient.get({
      baseUrl,
      url: `/v1/api/accounts/${params.gatewayAccountId}`,
      correlationId: params.correlationId,
      json: true,
      description: `find a gateway account by external id`,
      service: SERVICE_NAME
    }).then(ga => new GatewayAccount(ga))
  }

  return {
    getGatewayAccountByExternalId
  }
}
