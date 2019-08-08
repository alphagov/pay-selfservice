'use strict'

const baseClient = require('./base_client/base_client')

const defaultOptions = {
  baseUrl: process.env.LEDGER_URL,
  json: true,
  service: 'ledger'
}

const legacyConnectorTransactionParity = (transaction) => {
  if (transaction.refund_summary && transaction.refund_summary.amount_refunded) {
    transaction.refund_summary.amount_submitted = transaction.refund_summary.amount_refunded
  }
  transaction.charge_id = transaction.transaction_id
  return transaction
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
  const legacyConnectorEventsParity = (transactionEvents) => {
    transactionEvents.events = transactionEvents.events.map(event => {
      return Object.assign({
        type: event.resource_type.toLowerCase(),
        updated: event.timestamp,
        ...(event.data.refunded_by) && { submitted_by: event.data.refunded_by }
      }, event)
    })
    return transactionEvents
  }
  const configuration = Object.assign({
    url: `/v1/transaction/${transactionId}/event`,
    qs: { gateway_account_id: gatewayAccountId },
    description: 'List events for a given transaction',
    transform: legacyConnectorEventsParity
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
