'use strict'

module.exports.getStripeAccount = (gatewayAccountId, stripeAccountId) => {
  const stripeAccountStub = {
    name: 'getStripeAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      stripe_account_id: stripeAccountId
    }
  }
  return stripeAccountStub
}
