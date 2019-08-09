'use strict'

const baseClient = require('./base_client/base_client')

const defaultOptions = {
  baseUrl: process.env.LEDGER_URL,
  json: true,
  service: 'ledger'
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
  transactions
}
