'use strict'

const lodash = require('lodash')

const logger = require('../utils/logger')(__filename)
const userService = require('../services/user_service')
const transactionView = require('../utils/transaction_view.js')
const ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const Ledger = require('../services/clients/ledger_client')

module.exports = function (correlationId) {
  correlationId = correlationId || ''

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

  function refund (accountId, chargeId, amount, refundAmountAvailable, userExternalId, userEmail) {
    return new Promise(function (resolve, reject) {
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

  return {
    findWithEvents: ledgerFindWithEvents,
    refund: refund
  }
}
