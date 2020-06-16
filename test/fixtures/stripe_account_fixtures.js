'use strict'

const lodash = require('lodash')

const pactBase = require('./pact_base')

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
