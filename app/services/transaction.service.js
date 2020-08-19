'use strict'

const qs = require('qs')
const lodash = require('lodash')

const logger = require('../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const Ledger = require('./clients/ledger.client')
const { ConnectorClient } = require('./clients/connector.client')
const getQueryStringForParams = require('../utils/get-query-string-for-params')
const userService = require('../services/user.service')
const transactionView = require('../utils/transaction-view.js')

const connector = new ConnectorClient(process.env.CONNECTOR_URL)

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

const ledgerFindWithEvents = async function ledgerFindWithEvents (accountId, chargeId) {
  try {
    const charge = await Ledger.transaction(chargeId, accountId)
    const transactionEvents = await Ledger.events(chargeId, accountId)

    const userIds = lodash
      .chain(transactionEvents.events)
      .filter(event => event.data && event.data.refunded_by)
      .map(event => event.data.refunded_by)
      .uniq()
      .value()

    const users = await userService.findMultipleByExternalIds(userIds)

    return transactionView.buildPaymentView(charge, transactionEvents, users)
  } catch (error) {
    throw getStatusCodeForError(error)
  }
}

const refund = function refundTransaction (accountId, chargeId, amount, refundAmountAvailable, userExternalId, userEmail, correlationId) {
  const payload = {
    amount: amount,
    refund_amount_available: refundAmountAvailable,
    user_external_id: userExternalId,
    user_email: userEmail
  }

  logger.log('info', 'Submitting a refund for a charge', {
    'chargeId': chargeId,
    'amount': amount,
    'refundAmountAvailable': refundAmountAvailable,
    'userExternalId': userExternalId
  })

  const params = {
    gatewayAccountId: accountId,
    chargeId: chargeId,
    payload: payload,
    correlationId: correlationId
  }

  return new Promise(function (resolve, reject) {
    connector.postChargeRefund(params, function () {
      resolve()
    }).on('connectorError', (err, response, body) => {
      err = 'REFUND_FAILED'
      if (response && response.statusCode === 400) {
        if (body.reason) {
          err = body.reason
        }
      }
      if (response && response.statusCode === 412) {
        if (body.reason) {
          err = body.reason
        } else {
          err = 'refund_amount_available_mismatch'
        }
      }
      reject(err)
    })
  })
}

function getStatusCodeForError (err, response) {
  let status = 'CLIENT_UNAVAILABLE'
  const code = (response || {}).statusCode || (err || {}).errorCode
  if (code > 200) status = 'GET_FAILED'
  if (code === 404) status = 'NOT_FOUND'
  return status
}

module.exports = {
  search: searchLedger,
  csvSearchUrl,
  logCsvFileStreamComplete,
  ledgerFindWithEvents,
  refund
}
