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

function getLedgerDisputeTransactionsSuccess (opts) {
  const path = `/v1/transaction/${opts.disputeTransactionsDetails.parent_transaction_id}/transaction`
  return stubBuilder('GET', path, 200, {
    query: {
      gateway_account_id: opts.disputeTransactionsDetails.gateway_account_id,
      transaction_type: 'DISPUTE'
    },
    response: ledgerTransactionFixtures.validDisputeTransactionsResponse(opts.disputeTransactionsDetails)
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
    })
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

function getTransactionsSummarySuccess (opts) {
  const path = `/v1/report/transactions-summary`
  return stubBuilder('GET', path, 200, {
    response: ledgerTransactionFixtures.validTransactionSummaryDetails(opts)
  })
}

function getLedgerTransactionsFailure (opts, responseCode) {
  const path = `/v1/transaction`
  return stubBuilder('GET', path, responseCode, {
    query: {
      account_id: opts.account_id,
      limit_total: opts.limit_total,
      limit_total_size: opts.limit_total_size,
      from_date: opts.from_date,
      to_date: opts.to_date,
      page: opts.page,
      display_size: opts.display_size
    } })
}

module.exports = {
  getLedgerEventsSuccess,
  getLedgerTransactionSuccess,
  getLedgerTransactionsSuccess,
  getLedgerDisputeTransactionsSuccess,
  postRefundSuccess,
  postRefundAmountNotAvailable,
  getTransactionsSummarySuccess,
  getLedgerTransactionsFailure
}
