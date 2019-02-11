'use strict'

// NPM dependencies
const path = require('path')
const _ = require('lodash')

// Global setup
const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

function validGatewayAccount (opts) {
  const gatewayAccount = {
    payment_provider: opts.payment_provider || 'sandbox',
    gateway_account_id: opts.gateway_account_id || 31,
    service_name: opts.service_name || '8b9370c1a83c4d71a538a1691236acc2',
    type: opts.type || 'test',
    analytics_id: opts.analytics_id || '8b02c7e542e74423aa9e6d0f0628fd58',
    email_collection_mode: opts.email_collection_mode || 'MANDATORY',
    email_notifications: opts.email_notifications || {
      PAYMENT_CONFIRMED: {
        version: 1,
        enabled: true,
        template_body: 'template here'
      },
      REFUND_ISSUED: {
        version: 1,
        enabled: true
      }
    }
  }

  if (opts.description) {
    gatewayAccount.description = opts.description
  }
  if (opts.analytics_id) {
    gatewayAccount.analytics_id = opts.analytics_id
  }
  if (opts.toggle_3ds) {
    gatewayAccount.toggle_3ds = opts.toggle_3ds
  }

  return gatewayAccount
}

module.exports = {
  validGatewayAccountEmailRefundToggleRequest: (enabled = true) => {
    const data = {
      op: 'replace',
      path: '/refund/enabled',
      value: enabled
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
  validGatewayAccountEmailConfirmationToggleRequest: (enabled = true) => {
    const data = {
      op: 'replace',
      path: '/confirmation/enabled',
      value: enabled
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
  validGatewayAccountEmailCollectionModeRequest: (collectionMode = 'MANDATORY') => {
    const data = {
      op: 'replace',
      path: 'email_collection_mode',
      value: collectionMode
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
  validGatewayAccountTokensResponse: (opts = {}) => {
    let data = {
      tokens:
        [{
          issued_date: opts.issued_date || '03 Sep 2018 - 10:05',
          last_used: opts.last_used || null,
          token_link: opts.token_link || '32fa3cdd-23c8-4602-a415-b48ede66b5e4',
          description: opts.description || 'Created from command line',
          token_type: opts.token_type || 'CARD',
          created_by: opts.created_by || 'System generated'
        }]
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
  validGatewayAccountResponse: (opts = {}) => {
    let data = validGatewayAccount(opts)

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },
  validGatewayAccountsResponse: (opts = {}) => {
    const accounts = _.flatMap(opts.accounts, validGatewayAccount)
    let data = {
      accounts: accounts
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
  }
}
