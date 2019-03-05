'use strict'

class StripeAccount {
  constructor (opts) {
    this.stripeAccountId = opts.stripe_account_id
  }
}

module.exports = StripeAccount
