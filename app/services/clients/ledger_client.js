'use strict'

const url = require('url')
const baseClient = require('./base_client/base_client')
const {
  legacyConnectorTransactionParity,
  legacyConnectorEventsParity,
  legacyConnectorTransactionsParity,
  legacyConnectorTransactionSummaryParity
} = require('./utils/ledger_legacy_connector_parity')
const getQueryStringForParams = require('../../utils/get_query_string_for_params')

const defaultOptions = {
  baseUrl: process.env.LEDGER_URL,
  json: true,
  service: 'ledger'
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

const transactions = function transactions (gatewayAccountId, filters = {}, urlOverride, options = {}) {
  const path = `/v1/transaction?with_parent_transaction=true&account_id=${gatewayAccountId}&${getQueryStringForParams(filters, true, true)}`
  const configuration = Object.assign({
    url: urlOverride ? url.parse(urlOverride).path : path,
    description: 'List transactions for a given gateway account ID',
    transform: legacyConnectorTransactionsParity
  }, defaultOptions, options)

  return baseClient.get(configuration)
}

const allTransactionsAsCsv = function allTransactionsAsCsv (gatewayAccountId, filters = {}) {
  const queryParams = getQueryStringForParams(filters, true, true, true)
  const path = `/v1/transaction?with_parent_transaction=true&account_id=${gatewayAccountId}${queryParams === '' ? '' : '&' + queryParams}`
  const configuration = {
    baseUrl: process.env.LEDGER_URL,
    service: 'ledger',
    url: path,
    description: 'List transactions as CSV for a given gateway account ID',
    json: false,
    headers: {
      accept: 'text/csv'
    }
  }
  return baseClient.get(configuration)
}

const allTransactionPages = async function allTransactionPages (gatewayAccountId, filters = {}, options = {}) {
  let results = []
  const pageOptions = { hasMorePages: true }

  while (pageOptions.hasMorePages) {
    const nextPage = await transactions(gatewayAccountId, { pageSize: 500, ...filters }, pageOptions.url, options)
    const nextUrl = nextPage._links && nextPage._links.next_page
    pageOptions.url = nextUrl && nextUrl.href
    pageOptions.hasMorePages = nextUrl !== undefined

    results = results.concat(nextPage.results)
  }
  return { results }
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

const payouts = function payouts (gatewayAccountId, page = 1, displaySize) {
  const configuration = {
    url: '/v1/payout',
    qs: {
      gateway_account_id: gatewayAccountId,
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
  allTransactionPages,
  allTransactionsAsCsv,
  events,
  transactionSummary
}
