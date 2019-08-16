'use strict'

// NPM dependencies
const { createLogger, format, transports } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.Console()
  ]
})
const { AMOUNT } = require('@govuk-pay/pay-js-commons').loggingKeys
const lodash = require('lodash')

// Local dependencies
const userService = require('../services/user_service')
const transactionView = require('../utils/transaction_view.js')
const ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const Ledger = require('../services/clients/ledger_client')

const { FEATURE_USE_LEDGER_PAYMENTS } = process.env
const useLedgerTransactions = FEATURE_USE_LEDGER_PAYMENTS === 'true'

module.exports = function (correlationId) {
  correlationId = correlationId || ''

  function connectorFindWithEvents (accountId, chargeId) {
    return new Promise(function (resolve, reject) {
      const params = {
        gatewayAccountId: accountId,
        chargeId: chargeId,
        correlationId: correlationId
      }
      connector.getCharge(params, function (chargeData) {
        connector.getChargeEvents(params, function (eventsData) {
          let userIds = eventsData.events.filter(event => event.submitted_by)
            .map(event => event.submitted_by)
          userIds = lodash.uniq(userIds)
          if (userIds.length <= 0) {
            resolve(transactionView.buildPaymentView(chargeData, eventsData, []))
          } else {
            userService.findMultipleByExternalIds(userIds, correlationId)
              .then(users => {
                resolve(transactionView.buildPaymentView(chargeData, eventsData, users))
              })
              .catch(err => findWithEventsError(err, undefined, reject))
          }
        }).on('connectorError', (err, response) => {
          findWithEventsError(err, response, reject)
        })
      }).on('connectorError', (err, response) => {
        findWithEventsError(err, response, reject)
      })
    })
  }

  async function ledgerFindWithEvents (accountId, chargeId) {
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

  function refund (accountId, chargeId, amount, refundAmountAvailable, userExternalId) {
    return new Promise(function (resolve, reject) {
      const payload = {
        amount: amount,
        refund_amount_available: refundAmountAvailable,
        user_external_id: userExternalId
      }

      const obj = {}
      obj[AMOUNT] = amount
      obj['chargeId'] = chargeId
      obj['refundAmountAvailable'] = refundAmountAvailable
      obj['userExternalId'] = userExternalId

      logger.log('info', 'Submitting a refund for a charge', obj)

      const params = {
        gatewayAccountId: accountId,
        chargeId: chargeId,
        payload: payload,
        correlationId: correlationId
      }

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

  function findWithEventsError (err, response, reject) {
    const statusCode = getStatusCodeForError(err, response)
    reject(statusCode)
  }

  return {
    findWithEvents: useLedgerTransactions ? ledgerFindWithEvents : connectorFindWithEvents,
    refund: refund
  }
}
