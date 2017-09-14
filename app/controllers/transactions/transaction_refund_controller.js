'use strict'

// Local Dependencies
const Charge = require('../../models/charge.js')
const auth = require('../../services/auth_service.js')
const router = require('../../routes.js')
const {CORRELATION_HEADER} = require('../../utils/correlation_header.js')

const reasonMessages = {
  'refund_complete': '<h2>Refund successful</h2> It may take up to 6 days to process.',
  'REFUND_FAILED': '<h2>Refund failed</h2> We couldn’t process this refund. Try again later.',
  'full': '<h2>Repeat request</h2> This refund request has already been submitted. Refresh your transactions list.',
  'amount_not_available': '<h2>Select another amount</h2> The amount you tried to refund is greater than the transaction total',
  'amount_min_validation': '<h2>Select another amount</h2> The amount you tried to refund is less than the accepted minimum for this transaction.',
  'refund_amount_available_mismatch': '<h2>Repeat request</h2> This refund request has already been submitted. Refresh your transactions list.',
  'invalid_chars': '<h2>Use valid characters only</h2> Choose an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”'
}

module.exports = (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER]
  const userExternalId = req.user.externalId
  const charge = Charge(correlationId)
  const accountId = auth.getCurrentGatewayAccountId(req)
  const chargeId = req.params.chargeId
  const show = router.generateRoute(router.paths.transactions.detail, {chargeId})

  const refundAmount = req.body['refund-type'] === 'full' ? req.body['full-amount'] : req.body['refund-amount']
  const refundAmountAvailableInPence = parseInt(req.body['refund-amount-available-in-pence'])
  const refundMatch = /^([0-9]+)(?:\.([0-9]{2}))?$/.exec(refundAmount)

  if (!refundMatch) {
    req.flash('genericError', reasonMessages['invalid_chars'])
    return res.redirect(show)
  }

  let refundAmountForConnector = parseInt(refundMatch[1]) * 100
  if (refundMatch[2]) refundAmountForConnector += parseInt(refundMatch[2])

  return charge.refund(accountId, chargeId, refundAmountForConnector, refundAmountAvailableInPence, userExternalId)
    .then(
      () => {
        req.flash('generic', reasonMessages['refund_complete'])
        res.redirect(show)
      }
    )
    .catch(err => {
      req.flash('genericError', reasonMessages[err] ? reasonMessages[err] : reasonMessages.REFUND_FAILED)
      res.redirect(show)
    })
}
