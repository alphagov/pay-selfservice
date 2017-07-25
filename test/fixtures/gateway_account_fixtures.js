'use strict'

// NPM dependencies
const path = require('path')
const _ = require('lodash')

// Custom dependencies
const random = require(path.join(__dirname, '/../../app/utils/random'))

// Global setup
const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

module.exports = {

  validGatewayAccountResponse: (opts = {}) => {
    let data = {
      gateway_account_id: opts.gateway_account_id || random.randomInt(),
      service_name: opts.service_name || random.randomUuid(),
      type: opts.type || 'test',
      analytics_id: opts.analytics_id || random.randomUuid(),
      toggle_3ds: opts.toggle_3ds || false
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  validCreateGatewayAccountRequest: (opts = {}) => {
    const data = {
      payment_provider: opts.payment_provider || 'sandbox',
      service_name: opts.service_name || 'This is an account for the GOV.UK Pay team',
      analytics_id: opts.analytics_id || 'PAY-GA-123',
      type: opts.type || 'test'
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  validCreateGatewayAccountResponse: (opts = {}) => {
    const data = {
      gateway_account_id: opts.gateway_account_id || '1',
      description: opts.description || null,
      analytics_id: opts.analytics_id || null,
      links: [{
        href: 'https://connector.internal.pymnt.localdomain:9300/v1/api/accounts/' + (opts.gateway_account_id || '1'),
        rel: 'self',
        method: 'GET'
      }],
      type: opts.type || 'test'
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  }

}
