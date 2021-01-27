'use strict'

const { NotFoundError } = require('../../../app/errors')

module.exports = function restrictRequestsToLiveAccounts (req, res, next) {
  const requestHasValidLiveStripeAccount = req.account &&
    req.account.type &&
    req.account.payment_provider &&
    req.account.type.toLowerCase() === 'live' &&
    req.account.payment_provider.toLowerCase() === 'stripe'

  if (requestHasValidLiveStripeAccount) {
    next()
  } else {
    // we display 404 error, because from user point of view this page should not exist
    // if the user does not have a valid live Stripe account
    next(new NotFoundError())
  }
}
