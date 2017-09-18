'use strict';

const q = require('q')
const logger = require('winston')
const lodash = require('lodash')
const userService = require('../services/user_service')
const transactionView = require('../utils/transaction_view.js')
const ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = function (correlationId) {
  correlationId = correlationId || ''

  var findWithEvents = function (accountId, chargeId) {
    var defer = q.defer()
    var params = {
      gatewayAccountId: accountId,
      chargeId: chargeId,
      correlationId: correlationId
    }

    connector.getCharge(params, function (chargeData) {
      connector.getChargeEvents(params, function (eventsData) {
        let user_ids = eventsData.events.filter(event => event.submitted_by)
          .map(event => event.submitted_by)
        user_ids = lodash.uniq(user_ids)
        if (user_ids.length <= 0) {
          defer.resolve(transactionView.buildPaymentView(chargeData, eventsData))
        } else {
          userService.findMultipleByExternalIds(user_ids, correlationId)
            .then(users => {
              defer.resolve(transactionView.buildPaymentView(chargeData, eventsData, users))
            })
            .catch(err => findWithEventsError(err, undefined, defer))
        }
      }).on('connectorError', (err, response) => {
        findWithEventsError(err, response, defer)
      })
    }).on('connectorError', (err, response) => {
      findWithEventsError(err, response, defer)
    })
    return defer.promise
  }

  var refund = function (accountId, chargeId, amount, refundAmountAvailable, userExternalId) {
    var defer = q.defer()

    var payload = {
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

    var params = {
      gatewayAccountId: accountId,
      chargeId: chargeId,
      payload: payload,
      correlationId: correlationId
    }

    connector.postChargeRefund(params, function () {
      defer.resolve()
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
      defer.reject(err)
    })

    return defer.promise
  }

  var findWithEventsError = function (err, response, defer) {

    if (response && response.statusCode === 404 || err && err.errorCode === 404) return defer.reject('NOT_FOUND')
    if (response && response.statusCode !== 200 || err && err.errorCode > 200) return defer.reject('GET_FAILED')
    if (err) defer.reject('CLIENT_UNAVAILABLE')

    defer.reject('CLIENT_UNAVAILABLE')
  }

  return {
    findWithEvents: findWithEvents,
    refund: refund
  }
}
