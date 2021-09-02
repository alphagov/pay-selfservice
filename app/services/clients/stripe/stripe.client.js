'use strict'

const ProxyAgent = require('https-proxy-agent')

const StripeBankAccount = require('./StripeBankAccount.class')
const StripeCompany = require('./StripeCompany.class')
const StripePerson = require('./StripePerson.class')

// Constants
const STRIPE_HOST = process.env.STRIPE_HOST
const STRIPE_PORT = process.env.STRIPE_PORT

// Setup
let stripeConfig = {
  apiVersion: '2019-02-19'
}

if (process.env.http_proxy) {
  stripeConfig.httpAgent = new ProxyAgent(process.env.http_proxy)
}

// only expect host and port environment variables to be set when running tests
if (STRIPE_HOST) {
  stripeConfig.host = STRIPE_HOST
}
if (STRIPE_PORT) {
  stripeConfig.port = STRIPE_PORT
}

const stripe = require('stripe')(process.env.STRIPE_ACCOUNT_API_KEY, stripeConfig)

module.exports = {
  updateBankAccount: function (stripeAccountId, body) {
    const bankAccount = new StripeBankAccount(body)
    return stripe.accounts.update(stripeAccountId, bankAccount.basicObject())
  },

  updateCompany: function (stripeAccountId, body) {
    const company = new StripeCompany(body)
    return stripe.accounts.update(stripeAccountId, company.basicObject())
  },

  listPersons: function (stripeAccountId) {
    return stripe.accounts.listPersons(stripeAccountId)
  },

  updatePerson: function (stripeAccountId, stripePersonId, body) {
    const stripePerson = new StripePerson(body)
    return stripe.accounts.updatePerson(stripeAccountId, stripePersonId, stripePerson.basicObject())
  },

  retrieveAccountDetails: function (stripeAccountId) {
    return stripe.accounts.retrieve(stripeAccountId, {
      timeout: 1000
    })
  }
}
