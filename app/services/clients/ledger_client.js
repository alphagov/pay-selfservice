'use strict'

const baseClient = require('./base_client/base_client')
const { legacyConnectorTransactionParity, legacyConnectorEventsParity } = require('./utils/ledger_legacy_connector_parity')

const defaultOptions = {
  baseUrl: process.env.LEDGER_URL,
  json: true,
  service: 'ledger'
}

const transaction = function transaction (id, gatewayAccountId, options = {}) {
  const configuration = Object.assign({
    url: `/v1/transaction/${id}`,
    qs: { account_id: gatewayAccountId },
    description: 'Get individual transaction details',
    transform: legacyConnectorTransactionParity
  }, defaultOptions, options)
  return baseClient.get(configuration)
}

const events = function events (transactionId, gatewayAccountId, options = {}) {
  const configuration = Object.assign({
    url: `/v1/transaction/${transactionId}/event`,
    qs: { gateway_account_id: gatewayAccountId },
    description: 'List events for a given transaction',
    transform: legacyConnectorEventsParity
  }, defaultOptions, options)
  return baseClient.get(configuration)
}

const transactions = function transactions (gatewayAccountId, filters = {}, options = {}) {
  const configuration = Object.assign({
    url: '/v1/transaction',
    qs: { account_id: gatewayAccountId },
    description: 'List transactions for a given gateway account ID'
  }, defaultOptions, options)
  return baseClient.get(configuration)
}

module.exports = {
  transaction,
  transactions,
  events
}
