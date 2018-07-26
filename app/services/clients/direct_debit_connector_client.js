'use strict'

// Local Dependencies
const GatewayAccount = require('../../models/DirectDebitGatewayAccount.class')
const baseClient = require('./base_client/base_client')

// Constants
const DIRECT_DEBIT_CONNECTOR_URL = process.env.DIRECT_DEBIT_CONNECTOR_URL
const DIRECT_DEBIT_TOKEN_PREFIX = 'DIRECT_DEBIT:'
const baseUrl = `${DIRECT_DEBIT_CONNECTOR_URL}/v1/api`
const SERVICE_NAME = 'directdebit-connector'

// Exports
module.exports = {
  isADirectDebitAccount,
  gatewayAccount: {
    create: createGatewayAccount,
    get: getGatewayAccountByExternalId,
    patch: patchGatewayAccount
  },
  gatewayAccounts: {
    get: getGatewayAccountsByExternalIds
  }
}

function isADirectDebitAccount (accountId) {
  return accountId && (typeof accountId === 'string') && accountId.startsWith(DIRECT_DEBIT_TOKEN_PREFIX)
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

function getGatewayAccountsByExternalIds (params) {
  return baseClient.get({
    baseUrl,
    url: `/accounts?externalAccountIds=${params.gatewayAccountIds.join(',')}`,
    correlationId: params.correlationId,
    json: true,
    description: `find gateway accounts by external ids`,
    service: SERVICE_NAME
  })
}

function patchGatewayAccount (params) {
  const payload = [
    {
      op: 'replace',
      path: 'access_token',
      value: params.access_token
    },
    {
      op: 'replace',
      path: 'organisation',
      value: params.organisation_id
    }
  ]

  return baseClient.patch({
    baseUrl,
    url: `/accounts/${params.gatewayAccountId}`,
    json: true,
    body: payload,
    correlationId: params.correlationId,
    description: 'update an existing gateway account with access token and organisation id',
    service: SERVICE_NAME
  })
}
