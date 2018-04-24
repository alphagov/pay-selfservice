'use strict'

// NPM dependencies
const path = require('path')
const _ = require('lodash')

// Global setup
const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

module.exports = {

  validGatewayAccountResponse: (opts = {}) => {
    let data = {
      gateway_account_id: opts.gateway_account_id || 31,
      service_name: opts.service_name || '8b9370c1a83c4d71a538a1691236acc2',
      type: opts.type || 'test',
      analytics_id: opts.analytics_id || '8b02c7e542e74423aa9e6d0f0628fd58',
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
  validDirectDebitGatewayAccountResponse: (opts = {}) => {
    const data = {
      gateway_account_id: opts.gateway_account_id || 73,
      gateway_account_external_id: opts.gateway_account_external_id || 'DIRECT_DEBIT:' + 'a9c797ab271448bdba21359e15672076',
      service_name: opts.service_name || '8c0045d0664743c68e25489781e05b1d',
      payment_provider: opts.service_name || 'sandbox',
      type: opts.type || 'test',
      analytics_id: opts.analytics_id || 'd82dae5bcb024828bb686574a932b5a5'
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
