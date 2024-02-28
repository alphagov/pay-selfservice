'use strict'

const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')
const { configureClient } = require('./base/config')
const urlJoin = require('url-join')
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

const transaction = async function transaction (id, gatewayAccountId, options = {}) {
  this.client = new Client(defaultOptions.service)
  const baseUrl = options.baseUrl ? options.baseUrl : defaultOptions.baseUrl
  let url = `${baseUrl}/v1/transaction/${id}?account_id=${gatewayAccountId}`
  if ( options.transaction_type ) {
    url = `${url}&transaction_type=${options.transaction_type}`
  }
  configureClient(this.client, url)
  const response = await this.client.get(url, 'Get individual transaction details')
  const body = legacyConnectorTransactionParity(response.data)
  return body
}

const transactionWithAccountOverride = async function transactionWithAccountOverride (id, options = {}) {
  const url = urlJoin(defaultOptions.baseUrl,'/v1/transaction', id)
  this.client = new Client(defaultOptions.service)
  const fullUrl = `${url}?override_account_id_restriction=true`
  configureClient(this.client, fullUrl)
  const response = await this.client.get(fullUrl, 'Get individual transaction details with no accountId restriction')
  return response.data
}

async function getDisputesForTransaction (id, gatewayAccountId, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultOptions.baseUrl
  const url = urlJoin(baseUrl,'/v1/transaction', id, 'transaction')
  this.client = new Client(defaultOptions.service)
  const fullUrl = `${url}?gateway_account_id=${gatewayAccountId}&transaction_type=DISPUTE`
  configureClient(this.client, fullUrl)
  const response = await this.client.get(fullUrl, 'Get disputes for payment')
  return response.data
}

const events = async function events (transactionId, gatewayAccountId, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultOptions.baseUrl
  const url = urlJoin(baseUrl,'/v1/transaction', transactionId, 'event')
  this.client = new Client(defaultOptions.service)
  const fullUrl = `${url}?gateway_account_id=${gatewayAccountId}`
  configureClient(this.client, fullUrl)
  const response = await this.client.get(fullUrl, 'List events for a given transaction')
  const body = legacyConnectorEventsParity(response.data)
  return body
}

const transactions = async function transactions (gatewayAccountIds = [], filters = {}, options = {}) {
  const formatOptions = { arrayFormat: 'comma' }
  const path = '/v1/transaction'
  const params = {
    account_id: gatewayAccountIds,
    limit_total: defaultOptions.limit_total,
    limit_total_size: defaultOptions.limit_total_size
  }

  const formattedParams = qs.stringify(params, formatOptions)
  const formattedFilterParams = getQueryStringForParams(filters, true, true)
  const baseUrl = options.baseUrl ? options.baseUrl : defaultOptions.baseUrl
  const url = `${baseUrl}${path}?${formattedParams}&${formattedFilterParams}`
  this.client = new Client(defaultOptions.service)
  configureClient(this.client, url)
  const response = await this.client.get(
    url,
    'List transactions for a given gateway account ID',
    {
      data : {
        gateway_account_ids: gatewayAccountIds,
        multiple_accounts: gatewayAccountIds.length > 1,
        filters: Object.keys(filters).sort().join(', ')
      }
    }
  )
  const body = legacyConnectorTransactionsParity(response.data)
  return body
}

const transactionSummary = async function transactionSummary (gatewayAccountId, fromDate, toDate, options = {}) {
  const path = '/v1/report/transactions-summary'
  const baseUrl = options.baseUrl ? options.baseUrl : defaultOptions.baseUrl
  const url = `${baseUrl}${path}?account_id=${gatewayAccountId}&from_date=${fromDate}&to_date=${toDate}`
  this.client = new Client(defaultOptions.service)
  configureClient(this.client, url)
  const response = await this.client.get(url,'Transaction summary statistics for a given gateway account ID')
  const body = legacyConnectorTransactionSummaryParity(response.data)
  return body
}

const payouts = async function payouts (gatewayAccountIds = [], page = 1, displaySize, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultOptions.baseUrl
  let url = `${baseUrl}/v1/payout?gateway_account_id=${gatewayAccountIds.join(',')}&state=paidout&page=${page}`
  if ( displaySize ) {
    url = `${url}&display_size=${displaySize}`
  }
  this.client = new Client(defaultOptions.service)
  configureClient(this.client, url)
  const response = await this.client.get(url,'List payouts for a given gateway account ID')
  return response.data
}

/**
 * The intention is that in the future, getting agreements will use a tuple of service id and live flag, in favour of
 * the internal gateway account ID. However, this requires having a maximum of 1 test gateway account per service, which
 * we haven't realised yet. For now, we additionally send the gateway account ID but the intention is to remove the need
 * to send this.
 */
const agreements = async function agreements (serviceId, live, accountId, page = 1, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultOptions.baseUrl
  let url = `${baseUrl}/v1/agreement?service_id=${serviceId}&account_id=${accountId}&live=${live}&page=${page}`
  if ( options.filters ) {
    const filterParams = new URLSearchParams(options.filters).toString()
    url = `${url}&${filterParams}`
  }
  this.client = new Client(defaultOptions.service)
  configureClient(this.client, url)
  const response = await this.client.get(url,'List agreements for a given service and environment')
  return response.data
}

const agreement = async function agreement (id, serviceId, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultOptions.baseUrl
  let url = `${baseUrl}/v1/agreement/${id}?service_id=${serviceId}`
  this.client = new Client(defaultOptions.service)
  configureClient(this.client, url)
  const response = await this.client.get(url,'Get agreement by ID')
  return response.data
}

module.exports = {
  transaction,
  transactions,
  getDisputesForTransaction,
  payouts,
  transactionWithAccountOverride,
  events,
  transactionSummary,
  agreements,
  agreement
}
