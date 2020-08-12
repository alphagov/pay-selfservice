'use strict'

module.exports = {
  stubStripeAccountGet: function stubStripeAccountGet (gatewayAccountId, stripeAccountId) {
    const stripeAccountStub = {
      name: 'getStripeAccountSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        stripe_account_id: stripeAccountId
      }
    }
    return stripeAccountStub
  }
}
