'use strict'

// Local Dependencies
const { refund } = require('../../services/transaction.service')
const router = require('../../routes.js')
const { CORRELATION_HEADER } = require('../../utils/correlation-header.js')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

const reasonMessages = {
  'refund_complete': '<h2>Refund successful</h2> It may take up to 6 days to process.',
  'REFUND_FAILED': '<h2>Refund failed</h2> We couldn’t process this refund. Try again later.',
  'full': '<h2>Repeat request</h2> This refund request has already been submitted. Refresh your transactions list.',
  'amount_not_available': '<h2>Select another amount</h2> The amount you tried to refund is greater than the transaction total',
  'amount_min_validation': '<h2>Select another amount</h2> The amount you tried to refund is less than the accepted minimum for this transaction.',
  'refund_amount_available_mismatch': '<h2>Repeat request</h2> This refund request has already been submitted. Refresh your transactions list.',
  'invalid_chars': '<h2>Use valid characters only</h2> Choose an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”'
}

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
      req.flash('genericError', reasonMessages['invalid_chars'])
      return res.redirect(transactionDetailPath)
    }

    try {
      await refund(accountId, chargeId, refundAmountInPence, refundAmountAvailableInPence, userExternalId, userEmail, correlationId)
      req.flash('generic', reasonMessages['refund_complete'])
      res.redirect(transactionDetailPath)
    } catch (err) {
      req.flash('genericError', reasonMessages[err] ? reasonMessages[err] : reasonMessages.REFUND_FAILED)
      res.redirect(transactionDetailPath)
    }
  } catch (err) {
    next(err)
  }
}

module.exports = refundTransaction
