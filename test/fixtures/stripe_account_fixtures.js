'use strict'

const lodash = require('lodash')
const { pactify } = require('./pact_base')

module.exports = {
  buildGetStripeAccountResponse (opts = {}) {
    const data = {
      'stripe_account_id': opts.stripe_account_id
    }

    return {
      getPactified: () => {
        return pactify(data)
      },
      getPlain: () => {
        return lodash.clone(data)
      }
    }
  }
}
