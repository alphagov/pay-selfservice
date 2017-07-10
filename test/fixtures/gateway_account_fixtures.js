'use strict'

// NPM dependencies
const _ = require('lodash')

// Custom dependencies
const random = require(__dirname + '/../../app/utils/random')

// Global setup
const pactBase = require(__dirname + '/pact_base')
const pactRegister = pactBase()

module.exports = {

  validCreateGatewayAccountRequest: (opts = {}) => {
    const data = {
      payment_provider: opts.payment_provider || 'sandbox',
      description: opts.description || 'This is an account for the GOV.UK Pay team',
      analytics_id: opts.analytics_id || 'PAY-GA-123',
      type: opts.type || 'test'
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  }

}
