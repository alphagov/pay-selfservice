'use strict'

const baseClient = require('./base_client/base_client')

const defaultOptions = {
  baseUrl: process.env.LEDGER_URL,
  json: true,
  service: 'ledger'
}

const transaction = function transaction (id, gatewayAccountId, options = {}) {
  const configuration = Object.assign({
    url: `/v1/transaction/${id}`,
    qs: { account_id: gatewayAccountId },
    description: 'Get individual transaction details'
  }, defaultOptions, options)
  return baseClient.get(configuration)
}

const events = function events (transactionId, gatewayAccountId, options = {}) {
  const configuration = Object.assign({
    url: `/v1/transaction/${transactionId}/event`,
    qs: { account_id: gatewayAccountId },
    description: 'List events for a given transaction'
  }, defaultOptions, options)
  return baseClient.get(configuration)
}

const transactions = function transactions (gatewayAccountId, options = {}) {
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
