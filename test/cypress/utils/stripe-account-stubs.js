'use strict'

const getStripeAccountSuccess = function (gatewayAccountId, stripeAccountId) {
  return {
    name: 'getStripeAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      stripe_account_id: stripeAccountId
    }
  }
}

module.exports = {
  getStripeAccountSuccess
}
