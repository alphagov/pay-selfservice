'use strict'

// NPM dependencies
const path = require('path')

// Global setup
const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

module.exports = {

  validTransactionSummaryResponse: () => {
    let data = {
      successful_payments: {count: 1, total_in_pence: 2},
      refunded_payments: {count: 3, total_in_pence: 4},
      net_income: {total_in_pence: 5}
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
  validTransactionsResponse: (opts = {}) => {
    let data = {
      total: 1,
      count: 1,
      page: 1,
      results:
      [{
        amount: 20000,
        state: {finished: true, code: 'P0010', message: 'Payment method rejected', status: 'declined'},
        description: 'ref1',
        reference: 'ref188888',
        links: [{
          rel: 'self',
          method: 'GET',
          href: `https://myconnector.local/v1/api/accounts/${opts.gatewayAccountId}/charges/ht439nfg2l1e303k0dmifrn4fc`
        }, {
          rel: 'refunds',
          method: 'GET',
          href: `https://myconnector.local/v1/api/accounts/${opts.gatewayAccountId}/charges/ht439nfg2l1e303k0dmifrn4fc/refunds`
        }],
        charge_id: 'ht439nfg2l1e303k0dmifrn4fc',
        gateway_transaction_id: '4cddd970-cce9-4bf1-b087-f13db1e199bd',
        email: 'gds-payments-team-smoke@digital.cabinet-office.gov.uk',
        created_date: '2018-05-01T13:27:00.057Z',
        card_details: {
          last_digits_card_number: '0002',
          cardholder_name: 'Test User',
          expiry_date: '08/23',
          card_brand: 'Visa'
        },
        transaction_type: 'charge'
      }],
      _links: {
        self: {
          href: `https://myconnector.local/v2/api/accounts/${opts.gatewayAccountId}/charges?email=&page=1&display_size=100`
        },
        last_page: {
          href: `https://myconnector.local/v2/api/accounts/${opts.gatewayAccountId}/charges?email=&page=1&display_size=100`
        },
        first_page: {
          href: `https://myconnector.local/v2/api/accounts/${opts.gatewayAccountId}/charges?email=&page=1&display_size=100`
        }
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
  }

}
