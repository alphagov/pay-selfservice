'use strict'

// NPM dependencies
const stripe = require('stripe')(process.env.STRIPE_ACCOUNT_API_KEY)
const ProxyAgent = require('https-proxy-agent')

// Local dependencies
const StripeBankAccount = require('./stripeBankAccount.model')

// Constants
const STRIPE_HOST = process.env.STRIPE_HOST
const STRIPE_PORT = process.env.STRIPE_PORT

// Setup
if (process.env.http_proxy) {
  stripe.setHttpAgent(new ProxyAgent(process.env.http_proxy))
}
// only expect host and port environment variables to be set when running tests
if (STRIPE_HOST) {
  stripe.setHost(STRIPE_HOST)
}
if (STRIPE_PORT) {
  stripe.setPort(STRIPE_PORT)
}

module.exports = {
  updateBankAccount: function (stripeAccountId, body) {
    const bankAccount = new StripeBankAccount(body)
    return stripe.accounts.update(stripeAccountId, bankAccount.basicObject())
  }
}
