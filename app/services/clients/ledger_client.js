'use strict'

const url = require('url')
const baseClient = require('./base_client/base_client')
const {
  legacyConnectorTransactionParity,
  legacyConnectorEventsParity,
  legacyConnectorTransactionsParity
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

const events = function events (transactionId, gatewayAccountId, options = {}) {
  const configuration = Object.assign({
    url: `/v1/transaction/${transactionId}/event`,
    qs: {
      account_id: gatewayAccountId,
      ...options.transaction_type && { transaction_type: options.transaction_type }
    },
    description: 'List events for a given transaction',
    transform: legacyConnectorEventsParity
  }, defaultOptions, options)
  return baseClient.get(configuration)
}

const transactions = function transactions (gatewayAccountId, filters = {}, urlOverride, options = {}) {
  const path = `/v1/transaction?account_id=${gatewayAccountId}&${getQueryStringForParams(filters, true, true)}`
  const configuration = Object.assign({
    url: urlOverride ? url.parse(urlOverride).path : path,
    description: 'List transactions for a given gateway account ID',
    transform: legacyConnectorTransactionsParity
  }, defaultOptions, options)

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

module.exports = {
  transaction,
  transactions,
  allTransactionPages,
  events
}
