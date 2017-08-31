'use strict'

// Local Dependencies
const Charge = require('../../models/charge.js')
const auth = require('../../services/auth_service.js')
const router = require('../../routes.js')
const {renderErrorView} = require('../../utils/response.js')
const {CORRELATION_HEADER} = require('../../utils/correlation_header.js')

const errReasonMessages = {
  'REFUND_FAILED': "Can't process refund",
  'full': "Can't do refund: This charge has been already fully refunded",
  'amount_not_available': "Can't do refund: The requested amount is bigger than the amount available for refund",
  'amount_min_validation': "Can't do refund: The requested amount is less than the minimum accepted for issuing a refund for this charge",
  'refund_amount_available_mismatch': 'Refund failed. This refund request has already been submitted.'
}

module.exports = (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER]
  const charge = Charge(correlationId)
  const accountId = auth.getCurrentGatewayAccountId(req)
  const chargeId = req.params.chargeId
  const show = router.generateRoute(router.paths.transactions.detail, {chargeId})

  const refundAmount = req.body['refund-type'] === 'full' ? req.body['full-amount'] : req.body['refund-amount']
  const refundAmountAvailableInPence = parseInt(req.body['refund-amount-available-in-pence'])
  const refundMatch = /^([0-9]+)(?:\.([0-9]{2}))?$/.exec(refundAmount)

  if (!refundMatch) {
    return renderErrorView(req, res, "Can't do refund: amount must be pounds (10) or pounds and pence (10.10)")
  }

  let refundAmountForConnector = parseInt(refundMatch[1]) * 100
  if (refundMatch[2]) refundAmountForConnector += parseInt(refundMatch[2])

  charge.refund(accountId, chargeId, refundAmountForConnector, refundAmountAvailableInPence)
    .then(() => res.redirect(show))
    .catch(err => {
      renderErrorView(req, res, errReasonMessages[err] ? errReasonMessages[err] : errReasonMessages.REFUND_FAILED)
    })
}
