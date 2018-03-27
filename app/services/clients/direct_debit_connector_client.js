'use strict'

// Local Dependencies
const GatewayAccount = require('../../models/DirectDebitGatewayAccount.class')
const baseClient = require('./base_client/base_client')
const DIRECT_DEBIT_CONNECTOR_URL = process.env.DIRECT_DEBIT_CONNECTOR_URL
const DIRECT_DEBIT_TOKEN_PREFIX = 'DIRECT_DEBIT:'
// Use baseurl to create a baseclient for the direct debit microservice
const baseUrl = `${DIRECT_DEBIT_CONNECTOR_URL}/v1/api`

// Constants
const SERVICE_NAME = 'directdebit-connector'

// Exports
module.exports = {
  isADirectDebitAccount,
  gatewayAccount: {
    create: createGatewayAccount,
    get: getGatewayAccountByExternalId
  }
}

function isADirectDebitAccount (accountId) {
  return accountId.startsWith(DIRECT_DEBIT_TOKEN_PREFIX)
}

function createGatewayAccount (options) {
  return baseClient.post({
    baseUrl,
    url: `/accounts`,
    json: true,
    body: {
      payment_provider: options.paymentProvider,
      service_name: options.serviceName,
      type: options.type,
      description: options.description,
      analytics_id: options.analyticsId
    },
    correlationId: options.correlationId,
    description: 'create a direct debit gateway account',
    service: SERVICE_NAME
  }).then(ga => new GatewayAccount(ga))
}

function getGatewayAccountByExternalId (params) {
  return baseClient.get({
    baseUrl,
    url: `/accounts/${params.gatewayAccountId}`,
    correlationId: params.correlationId,
    json: true,
    description: `find a gateway account by external id`,
    service: SERVICE_NAME
  }).then(ga => new GatewayAccount(ga))
}
