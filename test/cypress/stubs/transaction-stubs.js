'use strict'

const lodash = require('lodash')

const ledgerTransactionFixtures = require('../../fixtures/ledger-transaction.fixtures')
const refundFixtures = require('../../fixtures/refund.fixtures')
const { stubBuilder } = require('./stub-builder')

function getLedgerTransactionSuccess (opts) {
  const path = `/v1/transaction/${opts.transactionDetails.transaction_id}`
  return stubBuilder('GET', path, 200, {
    response: ledgerTransactionFixtures.validTransactionDetailsResponse(opts.transactionDetails)
  })
}

function getLedgerEventsSuccess (opts) {
  const path = `/v1/transaction/${opts.transactionId}/event`
  return stubBuilder('GET', path, 200, {
    response: ledgerTransactionFixtures.validTransactionEventsResponse({
      transaction_id: opts.transactionId,
      payment_states: opts.events
    })
  })
}

function getLedgerTransactionsSuccess (opts) {
  const path = '/v1/transaction'
  return stubBuilder('GET', path, 200, {
    query: lodash.defaults({ ...opts.filters }, {
      account_id: opts.gatewayAccountIds ? opts.gatewayAccountIds.join(',') : opts.gatewayAccountId,
      page: opts.page || 1,	
      display_size: opts.displaySize || 100,	
      limit_total: true,	
      limit_total_size: 5001
    }),
    response: ledgerTransactionFixtures.validTransactionSearchResponse({
      page: opts.page || 1,
      display_size: opts.displaySize,
      transaction_length: opts.transactionLength || 1000,
      transaction_count: opts.transactionCount || 3,
      gateway_account_id: opts.gatewayAccountId,
      transactions: opts.transactions || [],
      links: opts.links || {}
    })
  })
}

function postRefundSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/charges/${opts.transactionId}/refunds`
  return stubBuilder('POST', path, 200, {
    request: refundFixtures.validTransactionRefundRequest({
      amount: opts.refundAmount,
      refund_amount_available: opts.refundAmountAvailable,
      user_external_id: opts.userExternalId,
      user_email: opts.userEmail
    }),
    verifyCalledTimes: opts.verifyCalledTimes
  })
}

function postRefundAmountNotAvailable (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/charges/${opts.transactionId}/refunds`
  return stubBuilder('POST', path, 400, {
    request: refundFixtures.validTransactionRefundRequest({
      amount: opts.refundAmount,
      refund_amount_available: opts.refundAmountAvailable,
      user_external_id: opts.userExternalId,
      user_email: opts.userEmail
    }),
    response: refundFixtures.invalidTransactionRefundResponse({
      error_identifier: 'REFUND_NOT_AVAILABLE',
      reason: 'amount_not_available'
    })
  })
}

module.exports = {
  getLedgerEventsSuccess,
  getLedgerTransactionSuccess,
  getLedgerTransactionsSuccess,
  postRefundSuccess,
  postRefundAmountNotAvailable
}
