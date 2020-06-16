'use strict'

const path = require('path')
const _ = require('lodash')

const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

function validGatewayAccount (opts) {
  const gatewayAccount = {
    payment_provider: opts.payment_provider || 'sandbox',
    gateway_account_id: opts.gateway_account_id || 31,
    allow_apple_pay: opts.allow_apple_pay || false,
    allow_google_pay: opts.allow_google_pay || false,
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
    },
    allow_moto: opts.allow_moto || false
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
  if (opts.requires3ds) {
    gatewayAccount.requires3ds = opts.requires3ds
  }
  if (opts.credentials) {
    gatewayAccount.credentials = opts.credentials
  }

  if (opts.notificationCredentials) {
    gatewayAccount.notificationCredentials = opts.notificationCredentials
  }

  if (opts.worldpay_3ds_flex) {
    gatewayAccount.worldpay_3ds_flex = opts.worldpay_3ds_flex
  }

  return gatewayAccount
}

module.exports = {
  validGatewayAccountPatchRequest: (opts = {}) => {
    const data = {
      op: 'replace',
      path: opts.path,
      value: opts.value
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
    const accounts = opts.accounts.map(validGatewayAccount)
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
      payment_provider: opts.payment_provider || 'sandbox',
      type: opts.type || 'test',
      analytics_id: opts.analytics_id || 'd82dae5bcb024828bb686574a932b5a5',
      is_connected: opts.is_connected || false
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
      type: opts.type || 'test'
    }

    if (opts.analytics_id) {
      data.analytics_id = opts.analytics_id
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
