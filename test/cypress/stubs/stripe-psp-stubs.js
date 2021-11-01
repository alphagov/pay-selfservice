'use strict'

const stripePspFixtures = require('../../fixtures/stripe-psp.fixtures')
const { stubBuilder } = require('./stub-builder')

function parseStripePersonOptions (opts) {
  return {
    director: opts.director || false,
    representative: opts.representative || false,
    stripe_account_id: opts.stripeAccountId || 'stripe-connect-account-id',
    phone: opts.phone || null,
    email: opts.email || null
  }
}

function parseStripeAccountOptions (opts) {
  return {
    url: opts.url || null,
    stripe_account_id: opts.stripeAccountId || 'stripe-connect-account-id'
  }
}

function listPersons (opts) {
  const path = `/v1/accounts/${opts.stripeAccountId}/persons`
  const fixtureOpts = parseStripePersonOptions(opts)
  return stubBuilder('GET', path, 200, {
    response: stripePspFixtures.validListStripePersons(fixtureOpts)
  })
}

function retrieveAccountDetails (opts) {
  const path = `/v1/accounts/${opts.stripeAccountId}`
  const fixtureOpts = parseStripeAccountOptions(opts)
  return stubBuilder('GET', path, 200, {
    response: stripePspFixtures.validRetrieveStripeAccountDetails(fixtureOpts)
  })
}

module.exports = {
  listPersons,
  retrieveAccountDetails
}
