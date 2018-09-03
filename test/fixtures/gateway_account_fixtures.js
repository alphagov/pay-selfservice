'use strict'

// NPM dependencies
const path = require('path')
const _ = require('lodash')

// Global setup
const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

module.exports = {
  validGatewayAccountEmailRefundToggleRequest: (opts = {}) => {
    const data = {
      op: opts.op || 'replace',
      path: opts.path || 'refund',
      value: opts.enabled || true
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
  validGatewayAccountEmailConfirmationToggleRequest: (opts = {}) => {
    const data = {
      op: opts.op || 'replace',
      path: opts.path || 'enabled',
      value: opts.enabled || true
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
  validGatewayAccountEmailCollectionModeRequest: (opts = {}) => {
    const data = {
      op: opts.op || 'replace',
      path: opts.path || 'collection',
      value: opts.collectionMode || 0
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
  validGatewayAccountEmailNotificationsResponse: (opts = {}) => {
    let data = {
      version: 1,
      enabled: true,
      emailCollectionMode: 1,
      refundEmailEnabled: true,
      accountEntity: {
        version: 1,
        credentials: {},
        requires3ds: false,
        live: false,
        gateway_account_id: opts.gatewayAccountId || 222,
        payment_provider: 'sandbox',
        type: 'test',
        service_name: 'local Pay test',
        card_types: [{
          id: '0b65832b-50bd-46b5-bdd2-e91574acbda6',
          brand: 'master-card',
          label: 'Mastercard',
          type: 'CREDIT',
          requires3ds: false
        }, {
          id: '462eef52-b3ea-4a9a-90eb-6912950de52b',
          brand: 'unionpay',
          label: 'Union Pay',
          type: 'CREDIT',
          requires3ds: false
        }, {
          id: '4d249b63-5b69-4813-877e-745f3df95be9',
          brand: 'master-card',
          label: 'Mastercard',
          type: 'DEBIT',
          requires3ds: false
        }, {
          id: '6473e1b2-0352-47c7-b097-5ae39e9adab6',
          brand: 'american-express',
          label: 'American Express',
          type: 'CREDIT',
          requires3ds: false
        }, {
          id: '900ae803-bacf-4709-b8a8-22f109d26d28',
          brand: 'visa',
          label: 'Visa',
          type: 'CREDIT',
          requires3ds: false
        }, {
          id: 'a6da4627-d0d0-4de0-91a4-d69963980cba',
          brand: 'jcb',
          label: 'Jcb',
          type: 'CREDIT',
          requires3ds: false
        }, {
          id: 'cbdb863a-fc5c-4053-b37a-64404a177146',
          brand: 'diners-club',
          label: 'Diners Club',
          type: 'CREDIT',
          requires3ds: false
        }, {
          id: 'ee7b9e4c-bfd4-45c1-b0b3-fbbb8f2f973b',
          brand: 'discover',
          label: 'Discover',
          type: 'CREDIT',
          requires3ds: false
        }, {
          id: 'f526f829-c387-4be1-88b2-5552e2cc149b',
          brand: 'visa',
          label: 'Visa',
          type: 'DEBIT',
          requires3ds: false
        }]
      }
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
    let data = {
      gateway_account_id: opts.gateway_account_id || 31,
      service_name: opts.service_name || '8b9370c1a83c4d71a538a1691236acc2',
      type: opts.type || 'test',
      analytics_id: opts.analytics_id || '8b02c7e542e74423aa9e6d0f0628fd58'
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
  validGatewayAccountsResponse: (opts = {}) => {
    let data = {
      accounts: opts.accounts ||
      [{
        type: 'test',
        gateway_account_id: 100,
        payment_provider: 'sandbox',
        service_name: 'Gateway Account 1 (test)',
        _links: { self: { href: 'https://connector.pymnt.localdomain/v1/api/accounts/100'}}
      }, {
        type: 'test',
        gateway_account_id: 101,
        payment_provider: 'sandbox',
        service_name: 'Gateway Account 2 (test)',
        _links: { self: { href: 'https://connector.pymnt.localdomain/v1/api/accounts/101'}}
      }, {
        type: 'test',
        gateway_account_id: 102,
        payment_provider: 'sandbox',
        service_name: 'Gateway Account 3 (test)',
        _links: { self: { href: 'https://connector.pymnt.localdomain/v1/api/accounts/102'}}
      }
      ]
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
