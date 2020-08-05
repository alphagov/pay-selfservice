'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const pactBase = require('./pact-base')

// Global setup
const pactRegister = pactBase()

module.exports = {
  buildGetStripeAccountResponse (opts = {}) {
    const data = {
      'stripe_account_id': opts.stripe_account_id
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return lodash.clone(data)
      }
    }
  }
}
