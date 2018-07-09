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
      total: opts.transactions.data.length,
      count: opts.transactions.data.length,
      page: 1,
      results:
        [...opts.transactions.data],
      _links: opts.transactions.links
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
  validTransactionDetailsResponse: (opts = {}) => {
    let data = {
      amount: opts.summaryObject.amount || 20000,
      state: opts.summaryObject.state || {
        finished: true,
        code: 'P0010',
        message: 'Payment method rejected',
        status: 'failed'
      },
      description: opts.summaryObject.description || 'ref1',
      reference: opts.summaryObject.reference || 'ref188888',
      links: [
        {
          rel: 'self',
          method: 'GET',
          href: opts.summaryObject.charge_id
            ? `https://connector.pymnt.localdomain/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.summaryObject.charge_id}`
            : 'https://connector.pymnt.localdomain/v1/api/accounts/2/charges/ht439nfg2l1e303k0dmifrn4fc'
        },
        {
          rel: 'refunds',
          method: 'GET',
          href: opts.summaryObject.charge_id
            ? `https://connector.pymnt.localdomain/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.summaryObject.charge_id}/refunds`
            : 'https://connector.pymnt.localdomain/v1/api/accounts/2/charges/ht439nfg2l1e303k0dmifrn4fc/refunds'
        }
      ],
      charge_id: opts.summaryObject.charge_id || 'ht439nfg2l1e303k0dmifrn4fc',
      gateway_transaction_id: opts.summaryObject.gateway_transaction_id || '4cddd970-cce9-4bf1-b087-f13db1e199bd',
      return_url: opts.summaryObject
        ? `https://demoservice.pymnt.localdomain:443/return/532aad2f833a3b8234921ca85a98ca5b/${opts.summaryObject.reference}`
        : 'https://demoservice.pymnt.localdomain:443/return/532aad2f833a3b8234921ca85a98ca5b/ref188888',
      email: opts.summaryObject.email || 'gds-payments-team-smoke@digital.cabinet-office.gov.uk',
      payment_provider: opts.summaryObject.payment_provider || 'sandbox',
      created_date: opts.summaryObject.created_data || '2018-05-01T13:27:00.057Z',
      refund_summary: opts.refund_summary || {
        status: 'unavailable',
        amount_available: 20000,
        amount_submitted: 0
      },
      settlement_summary: opts.settlement_summary ||{
        capture_submit_time: null,
        captured_date: null
      },
      card_details: {
        last_digits_card_number: opts.summaryObject.last_digits_card_number ||'0002',
        cardholder_name: opts.summaryObject.cardholder_name || 'Test User',
        expiry_date: opts.summaryObject.expiry_data || '08/23',
        billing_address: opts.billing_address || {
          line1: 'address line 1',
          line2: 'address line 2',
          postcode: 'AB1A 1AB',
          city: 'GB',
          county: null,
          country: 'GB'
        },
        card_brand: opts.summaryObject.card_brand || 'Visa'
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
