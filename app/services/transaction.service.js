'use strict'

const qs = require('qs')

const logger = require('../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const Ledger = require('./clients/ledger.client')
const getQueryStringForParams = require('../utils/get-query-string-for-params')

const searchLedger = async function searchLedger (gatewayAccountIds = [], filters) {
  try {
    const transactions = await Ledger.transactions(gatewayAccountIds, filters)
    return transactions
  } catch (error) {
    throw new Error('GET_FAILED')
  }
}

const csvSearchUrl = function csvSearchParams (filters, gatewayAccountIds = []) {
  const formatOptions = { arrayFormat: 'comma' }
  const params = {
    account_id: gatewayAccountIds
  }

  const formattedParams = qs.stringify(params, formatOptions)
  const formattedFilterParams = getQueryStringForParams(filters, true, true, true)
  return `${process.env.LEDGER_URL}/v1/transaction?${formattedParams}&${formattedFilterParams}`
}

const logCsvFileStreamComplete = function logCsvFileStreamComplete (timestampStreamStart, filters, gatewayAccountIds, user, correlationId) {
  const timestampStreamEnd = Date.now()
  const logContext = {
    time_taken: timestampStreamEnd - timestampStreamStart,
    from_date: filters.fromDate,
    to_date: filters.toDate,
    gateway_payout_id: filters.gatewayPayoutId,
    payment_states: filters.payment_states,
    refund_states: filters.refund_stats,
    method: 'future',
    gateway_account_ids: gatewayAccountIds,
    multiple_accounts: gatewayAccountIds.length > 1,
    filters: Object.keys(filters).sort().join(', ')
  }
  logContext[keys.USER_EXTERNAL_ID] = user && user.externalId
  logContext[keys.CORRELATION_ID] = correlationId
  logger.info('Completed file stream', logContext)
}

exports.search = searchLedger
exports.csvSearchUrl = csvSearchUrl
exports.logCsvFileStreamComplete = logCsvFileStreamComplete
