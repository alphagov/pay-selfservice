'use strict'

// Local Dependencies
const { refund } = require('../../services/transaction.service')
const router = require('../../routes.js')
const { CORRELATION_HEADER } = require('../../utils/correlation-header.js')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

const refundTransaction = async function refundTransaction (req, res, next) {
  try {
    const correlationId = req.headers[CORRELATION_HEADER]
    const userExternalId = req.user.externalId
    const userEmail = req.user.email
    const accountId = req.account.gateway_account_id
    const { chargeId } = req.params
    const transactionDetailPath = router.generateRoute(router.paths.transactions.detail, { chargeId })

    const isFullRefund = req.body['refund-type'] === 'full'
    const refundAmount = isFullRefund ? req.body['full-amount'] : req.body['refund-amount']
    const refundAmountAvailableInPence = parseInt(req.body['refund-amount-available-in-pence'])

    const refundAmountInPence = safeConvertPoundsStringToPence(refundAmount)
    if (!refundAmountInPence) {
      req.flash('refundError', 'Enter an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”')
      return res.redirect(transactionDetailPath)
    }

    try {
      await refund(accountId, chargeId, refundAmountInPence, refundAmountAvailableInPence, userExternalId, userEmail, correlationId)
      req.flash('refundSuccess', 'true')
    } catch (err) {
      req.flash('refundError', err.message)
    }
    res.redirect(transactionDetailPath)
  } catch (err) {
    next(err)
  }
}

module.exports = refundTransaction
