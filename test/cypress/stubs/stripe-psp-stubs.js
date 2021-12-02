'use strict'

const stripePspFixtures = require('../../fixtures/stripe-psp.fixtures')
const { stubBuilder } = require('./stub-builder')

function parseStripePersonOptions (opts) {
  return {
    director: opts.director || false,
    representative: opts.representative || false,
    stripe_account_id: opts.stripeAccountId || 'stripe-connect-account-id',
    firstName: opts.firstName || null,
    lastName: opts.lastName || null,
    phone: opts.phone || null,
    email: opts.email || null
  }
}

function parseStripeAccountOptions (opts) {
  return {
    url: opts.url || null,
    stripe_account_id: opts.stripeAccountId || 'stripe-connect-account-id',
    entity_verified: opts.entity_verified
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

function createOrUpdatePerson (opts) {
  const path = `/v1/accounts/${opts.stripeAccountId}/persons/person_1234`
  const fixtureOpts = parseStripePersonOptions(opts)
  return stubBuilder('POST', path, 200, {
    response: stripePspFixtures.validStripePerson(fixtureOpts)
  })
}

function updateCompany (opts) {
  const path = `/v1/accounts/${opts.stripeAccountId}`
  const fixtureOpts = parseStripeAccountOptions(opts)
  return stubBuilder('POST', path, 200, {
    response: stripePspFixtures.validRetrieveStripeAccountDetails(fixtureOpts)
  })
}

function updateAccount (opts) {
  const path = `/v1/accounts/${opts.stripeAccountId}`
  const fixtureOpts = parseStripeAccountOptions(opts)
  return stubBuilder('POST', path, 200, {
    response: stripePspFixtures.validRetrieveStripeAccountDetails(fixtureOpts)
  })
}

module.exports = {
  listPersons,
  retrieveAccountDetails,
  createOrUpdatePerson,
  updateCompany,
  updateAccount
}
