'use strict'

// NPM dependencies
const logger = require('winston')
const lodash = require('lodash')

// Local dependencies
const userService = require('../services/user_service')
const transactionView = require('../utils/transaction_view.js')
const ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = function (correlationId) {
  correlationId = correlationId || ''

  function findWithEvents (accountId, chargeId) {
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

  function refund (accountId, chargeId, amount, refundAmountAvailable, userExternalId) {
    return new Promise(function (resolve, reject) {
      const payload = {
        amount: amount,
        refund_amount_available: refundAmountAvailable,
        user_external_id: userExternalId
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

  function findWithEventsError (err, response, reject) {
    const code = (response || {}).statusCode || (err || {}).errorCode
    if (code === 404) return reject('NOT_FOUND')
    if (code > 200) return reject('GET_FAILED')
    reject('CLIENT_UNAVAILABLE')
  }

  return {
    findWithEvents: findWithEvents,
    refund: refund
  }
}
