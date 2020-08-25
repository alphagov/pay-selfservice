'use strict'

const baseClient = require('./base-client/base.client')
const {
  legacyConnectorTransactionParity,
  legacyConnectorEventsParity,
  legacyConnectorTransactionsParity,
  legacyConnectorTransactionSummaryParity
} = require('./utils/ledger-legacy-connector-parity')
const getQueryStringForParams = require('../../utils/get-query-string-for-params')
const qs = require('qs')

const defaultOptions = {
  baseUrl: process.env.LEDGER_URL,
  json: true,
  service: 'ledger',
  limit_total_size: process.env.CSV_MAX_LIMIT || 10000
}

const transaction = function transaction (id, gatewayAccountId, options = {}) {
  const configuration = Object.assign({
    url: `/v1/transaction/${id}`,
    qs: {
      account_id: gatewayAccountId,
      ...options.transaction_type && { transaction_type: options.transaction_type }
    },
    description: 'Get individual transaction details',
    transform: legacyConnectorTransactionParity
  }, defaultOptions, options)
  return baseClient.get(configuration)
}

const transactionWithAccountOverride = function transactionWithAccountOverride (id, options = {}) {
  const configuration = Object.assign({
    url: `/v1/transaction/${id}`,
    qs: {
      override_account_id_restriction: true
    },
    description: 'Get individual transaction details with no accountId restriction'
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

const transactions = function transactions (gatewayAccountIds = [], filters = {}, options = {}) {
  const formatOptions = { arrayFormat: 'comma' }
  const path = '/v1/transaction'
  const params = {
    account_id: gatewayAccountIds,
    limit_total: true,
    limit_total_size: defaultOptions.limit_total_size
  }

  const formattedParams = qs.stringify(params, formatOptions)
  const formattedFilterParams = getQueryStringForParams(filters, true, true)
  const configuration = Object.assign({
    url: `${path}?${formattedParams}&${formattedFilterParams}`,
    description: 'List transactions for a given gateway account ID',
    transform: legacyConnectorTransactionsParity,
    additionalLoggingFields: {
      gateway_account_ids: gatewayAccountIds,
      multiple_accounts: gatewayAccountIds.length > 1,
      filters: Object.keys(filters).sort().join(', ')
    }
  }, defaultOptions, options)

  return baseClient.get(configuration)
}

const transactionSummary = function transactionSummary (gatewayAccountId, fromDate, toDate, options = {}) {
  const path = '/v1/report/transactions-summary'
  const configuration = Object.assign({
    url: path,
    qs: {
      account_id: gatewayAccountId,
      from_date: fromDate,
      to_date: toDate
    },
    description: 'Transaction summary statistics for a given gateway account ID',
    transform: legacyConnectorTransactionSummaryParity
  }, defaultOptions, options)

  return baseClient.get(configuration)
}

const payouts = function payouts (gatewayAccountIds = [], page = 1, displaySize) {
  const configuration = {
    url: '/v1/payout',
    qs: {
      // qsStringifyOptions doesn't seem to be accepted here and the request library is deprecated for upstream changes
      gateway_account_id: gatewayAccountIds.join(','),
      state: 'paidout',
      ...displaySize && { display_size: displaySize },
      page
    },
    description: 'List payouts for a given gateway account ID',
    ...defaultOptions
  }

  return baseClient.get(configuration)
}

module.exports = {
  transaction,
  transactions,
  payouts,
  transactionWithAccountOverride,
  events,
  transactionSummary
}
