'use strict'

const qs = require('qs')
const lodash = require('lodash')

const logger = require('../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const Ledger = require('./clients/ledger.client')
const { ConnectorClient } = require('./clients/connector.client')
const getQueryStringForParams = require('../utils/get-query-string-for-params')
const userService = require('../services/user.service')
const transactionView = require('../utils/transaction-view')
const errorIdentifier = require('../models/error-identifier')

const connector = new ConnectorClient(process.env.CONNECTOR_URL)

const connectorRefundFailureReasons = {
  ALREADY_FULLY_REFUNDED: 'full',
  AMOUNT_NOT_AVAILABLE: 'amount_not_available',
  AMOUNT_BELOW_MINIMUM: 'amount_min_validation'
}

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

const logCsvFileStreamComplete = function logCsvFileStreamComplete (timestampStreamStart, filters, gatewayAccountIds, user, correlationId,
  allLiveServiceTransactions) {
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
    internal_user: user.internalUser,
    all_live_service_transactions: allLiveServiceTransactions,
    user_number_of_live_services: user.numberOfLiveServices,
    filters: Object.keys(filters).sort().join(', ')
  }
  logContext[keys.USER_EXTERNAL_ID] = user && user.externalId
  logContext[keys.CORRELATION_ID] = correlationId
  logger.info('Completed file stream', logContext)
}

const ledgerFindWithEvents = async function ledgerFindWithEvents (accountId, chargeId, correlationId) {
  try {
    const charge = await Ledger.transaction(chargeId, accountId)
    const transactionEvents = await Ledger.events(chargeId, accountId)

    const userIds = lodash
      .chain(transactionEvents.events)
      .filter(event => event.data && event.data.refunded_by)
      .map(event => event.data.refunded_by)
      .uniq()
      .value()

    if (userIds.length !== 0) {
      const users = await userService.findMultipleByExternalIds(userIds, correlationId)
      return transactionView.buildPaymentView(charge, transactionEvents, users)
    } else {
      return transactionView.buildPaymentView(charge, transactionEvents)
    }
  } catch (error) {
    throw getStatusCodeForError(error)
  }
}

const refund = async function refundTransaction (gatewayAccountId, chargeId, amount, refundAmountAvailable, userExternalId, userEmail, correlationId) {
  const logContext = {
    refund_amount_available: refundAmountAvailable,
    amount: amount
  }
  logContext[keys.USER_EXTERNAL_ID] = userExternalId
  logContext[keys.GATEWAY_ACCOUNT_ID] = gatewayAccountId
  logContext[keys.PAYMENT_EXTERNAL_ID] = chargeId
  logContext[keys.CORRELATION_ID] = correlationId
  logger.log('info', 'Submitting a refund for a charge', logContext)

  const payload = {
    amount: amount,
    refund_amount_available: refundAmountAvailable,
    user_external_id: userExternalId,
    user_email: userEmail
  }

  try {
    await connector.postChargeRefund(gatewayAccountId, chargeId, payload, correlationId)
  } catch (err) {
    if (err.errorIdentifier) {
      if (err.errorIdentifier === errorIdentifier.REFUND_AMOUNT_AVAILABLE_MISMATCH) {
        throw new Error('This refund request has already been submitted.')
      }

      if (err.errorIdentifier === errorIdentifier.REFUND_NOT_AVAILABLE &&
        err.reason) {
        if (err.reason === connectorRefundFailureReasons.ALREADY_FULLY_REFUNDED) {
          throw new Error('This refund request has already been submitted.')
        }
        if (err.reason === connectorRefundFailureReasons.AMOUNT_NOT_AVAILABLE) {
          throw new Error('The amount you tried to refund is greater than the amount available to be refunded. Please try again.')
        }
        if (err.reason === connectorRefundFailureReasons.AMOUNT_BELOW_MINIMUM) {
          throw new Error('The amount you tried to refund is too low. Please try again.')
        }
      }
    }
    throw new Error('We couldn’t process this refund. Please try again or contact support.')
  }
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
