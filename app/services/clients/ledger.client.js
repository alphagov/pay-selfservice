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
  limit_total_size: 5001,
  limit_total: true
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
    limit_total: defaultOptions.limit_total,
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

const payouts = function payouts (gatewayAccountIds = [], page = 1, displaySize, options = {}) {
  const configuration = Object.assign({
    url: '/v1/payout',
    qs: {
      // qsStringifyOptions doesn't seem to be accepted here and the request library is deprecated for upstream changes
      gateway_account_id: gatewayAccountIds.join(','),
      state: 'paidout',
      ...displaySize && { display_size: displaySize },
      page
    },
    description: 'List payouts for a given gateway account ID'
  }, defaultOptions, options)

  return baseClient.get(configuration)
}

// agreements use new tuple of service identifier and live flag in favour of
// internal connector gateway accounts
const agreements = function agreements (serviceId, live, page = 1, options = {}) {
  const config = {
    url: '/v1/agreement',
    qs: {
      service_id: serviceId,
      live,
      page
    },
    description: 'List agreements for a given service and environment',
    baseUrl: process.env.LEDGER_URL,
    json: true,
    service: 'ledger',
    ...options
  }

  return baseClient.get(config)
}

module.exports = {
  transaction,
  transactions,
  payouts,
  transactionWithAccountOverride,
  events,
  transactionSummary,
  agreements
}
