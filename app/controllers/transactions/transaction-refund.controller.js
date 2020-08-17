'use strict'

// Local Dependencies
const Charge = require('../../models/charge.js')
const auth = require('../../services/auth.service.js')
const router = require('../../routes.js')
const { CORRELATION_HEADER } = require('../../utils/correlation-header.js')

// markups are a BIG BIG NO NO !!!!
// pass error code and let nunjuck deal with it
// separate backend and internal errors (encapsulate it in a thing)
const reasonMessages = {
  'refund_complete': '<h2>Refund successful</h2> It may take up to 6 days to process.',
  'REFUND_FAILED': '<h2>Refund failed</h2> We couldn’t process this refund. Try again later.',
  'full': '<h2>Repeat request</h2> This refund request has already been submitted. Refresh your transactions list.',
  'amount_not_available': '<h2>Select another amount</h2> The amount you tried to refund is greater than the transaction total',
  'amount_min_validation': '<h2>Select another amount</h2> The amount you tried to refund is less than the accepted minimum for this transaction.',
  'refund_amount_available_mismatch': '<h2>Repeat request</h2> This refund request has already been submitted. Refresh your transactions list.',
  'invalid_chars': '<h2>Use valid characters only</h2> Choose an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”'
}

// naming critical paths helps with code navigation, clarity, stack traces
// compare standards across apps and come up with a sensible default (verbs etc.)
// const refundChargeHTTPController = function refundChargeHTTPController(req, res) {
function refundChargeHTTPController (req, res) {
  const correlationId = req.headers[CORRELATION_HEADER]
  const userExternalId = req.user.externalId
  const userEmail = req.user.email
  // rationalise what is model vs service and move/rename these as appropriate
  const chargeService = Charge(correlationId)
  // simplify getting accountId and not pass req object if possible. getCurrentGatewayAccountId is used at multiple places
  const accountId = auth.getCurrentGatewayAccountId(req)
  const { chargeId } = req.params

  // what does show mean? can this have a clearer name, naming conventions?
  const show = router.generateRoute(router.paths.transactions.detail, { chargeId })

  const refundAmount = req.body['refund-type'] === 'full' ? req.body['full-amount'] : req.body['refund-amount']
  const refundAmountAvailableInPence = parseInt(req.body['refund-amount-available-in-pence'])
  const refundMatch = /^([0-9]+)(?:\.([0-9]{2}))?$/.exec(refundAmount)

  if (!refundMatch) {
    req.flash('genericError', reasonMessages['invalid_chars'])
    return res.redirect(show)
  }

  let refundAmountForConnector = parseInt(refundMatch[1]) * 100
  if (refundMatch[2]) refundAmountForConnector += parseInt(refundMatch[2])

  // change to await try - catch
  return chargeService.refund(accountId, chargeId, refundAmountForConnector, refundAmountAvailableInPence, userExternalId, userEmail)
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

// define standard convention for module exports, look at what's currently done
// helpful for code navigation knowing where to consistently look
module.exports = refundChargeHTTPController
