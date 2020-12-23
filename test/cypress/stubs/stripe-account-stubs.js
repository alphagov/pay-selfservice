'use strict'

const stripeAccountFixtures = require('../../fixtures/stripe-account.fixtures')
const { stubBuilder } = require('./stub-builder')

function getStripeAccountSuccess (gatewayAccountId, stripeAccountId) {
  const path = `/v1/api/accounts/${gatewayAccountId}/stripe-account`
  return stubBuilder('GET', path, 200, {
    response: stripeAccountFixtures.buildGetStripeAccountResponse({
      stripe_account_id: stripeAccountId
    })
  })
}

module.exports = {
  getStripeAccountSuccess
}
