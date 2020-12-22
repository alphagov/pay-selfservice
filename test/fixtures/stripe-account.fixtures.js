'use strict'

function buildGetStripeAccountResponse (opts = {}) {
  return {
    'stripe_account_id': opts.stripe_account_id
  }
}

module.exports = {
  buildGetStripeAccountResponse
}
