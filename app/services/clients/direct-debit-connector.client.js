'use strict'

const GatewayAccount = require('../../models/DirectDebitGatewayAccount.class')
const baseClient = require('./base-client/base.client')

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
    get: getGatewayAccountByExternalId
  },
  gatewayAccounts: {
    get: getGatewayAccountsByExternalIds
  },
  partnerApp: {
    createState: createPartnerAppState,
    exchangeCode: exchangeAccessCode
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

/**
 * POST a gatewayAccountId and redirectUri and get a state token for GoCardless Partner app OAuth
 * @param {Object} params                   An object with the following properties
 * @param {String} params.redirectUri       The redirect uri that is registered with GoCardless   [required]
 * @param {String} params.gatewayAccountId  The external id for the gateway account to be patched [required]
 * @returns {Promise}
 */
function createPartnerAppState (params) {
  return baseClient.post({
    baseUrl,
    url: '/gocardless/partnerapp/states',
    json: true,
    body: {
      gateway_account_id: params.gatewayAccountId,
      redirect_uri: params.redirectUri
    },
    description: 'create a partner app state token',
    service: SERVICE_NAME
  })
}

/**
 * Exchanges a GoCardless access code with a permanent access token
 * @param {Object} params
 * @param {String} params.gocardlessUrl The base URL for GoCardless OAuth connect
 * @param {String} params.clientId      The GOV.UK Pay client id that is provided by GoCardless when creating a Partner app
 * @param {String} params.clientSecret  The GOV.UK Pay client secret that is provided by GoCardless when creating a Partner app
 * @param {String} params.code          The code that is provided by GoCardless when a Merchant links its account to Pay
 * @param {String} params.state         The state that is provided by Direct Debit Connector when sending initial OAuth request to GoCardless
 * @returns {Promise}
 */
function exchangeAccessCode (params) {
  return baseClient.post({
    baseUrl,
    url: `/gocardless/partnerapp/tokens`,
    json: true,
    body: {
      code: params.code,
      state: params.state
    },
    description: 'Exchange GoCardless code for token',
    service: SERVICE_NAME
  })
}
