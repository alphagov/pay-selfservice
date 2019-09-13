'use strict'

// NPM dependencies
const path = require('path')
const lodash = require('lodash')

// Global setup
const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

const buildChargeEventWithDefaults = (opts = {}) => {
  const chargeEvent = {
    type: opts.type || 'PAYMENT',
    state: buildChargeEventStateWithDefaults(opts.state),
    amount: opts.amount || 100,
    updated: opts.updated || '2018-05-01T13:27:00.063Z'
  }
  if (opts.refund_reference) {
    chargeEvent.refunds_reference = opts.refund_reference
  }
  if (opts.submitted_by) {
    chargeEvent.submitted_by = opts.submitted_by
  }
  return chargeEvent
}

const buildChargeEventStateWithDefaults = (opts = {}) => {
  let state
  if (opts.status === 'declined') {
    state = {
      status: opts.status,
      finished: true,
      code: opts.code || 'P0010',
      message: opts.message || 'Payment method rejected'
    }
  } else {
    state = {
      status: opts.status || 'started',
      finished: opts.finished || false
    }
  }

  return state
}

const buildPaymentEvents = (opts = {}) => {
  let events = []
  if (opts.payment_states) {
    opts.payment_states.forEach(paymentState => {
      events.push({
        state: buildChargeEventStateWithDefaults(paymentState),
        resource_type: 'PAYMENT',
        data: {}
      })
    })
  }
  return events
}

const buildTransactionDetails = (opts = {}) => {
  const data = {
    amount: opts.amount || 20000,
    state: buildChargeEventStateWithDefaults(opts.state),
    description: opts.description || 'ref1',
    reference: opts.reference || 'ref188888',
    transaction_id: opts.transaction_id,
    email: opts.email || 'gds-payments-team-smoke@digital.cabinet-office.gov.uk',
    payment_provider: opts.payment_provider || 'sandbox',
    created_date: opts.created_date || '2018-05-01T13:27:00.057Z',
    delayed_capture: opts.delayed_capture || false,
    transaction_type: 'PAYMENT'
  }

  if (opts.gateway_transaction_id) {
    data.gateway_transaction_id = opts.gateway_transaction_id
  }

  if (opts.includeCardDetails) {
    data.card_details = {
      last_digits_card_number: opts.last_digits_card_number || '0002',
      cardholder_name: opts.cardholder_name || 'Test User',
      expiry_date: opts.expiry_date || '08/23',
      billing_address: {
        line1: opts.billing_address_line1 || 'address line 1',
        line2: opts.billing_address_line2 || 'address line 2',
        postcode: opts.billing_address_postcode || 'AB1A 1AB',
        city: opts.billing_address_city || 'London',
        country: opts.billing_address_country || 'GB'
      },
      card_brand: opts.card_brand || 'Visa'
    }
  }

  if (opts.card_brand) {
    data.card_details = {
      card_brand: opts.card_brand
    }
  }

  if (opts.cardholder_name) {
    data.card_details = {
      cardholder_name: opts.cardholder_name
    }
  }

  if (opts.includeSearchResultCardDetails) {
    data.card_details = {
      last_digits_card_number: opts.last_digits_card_number || '0002',
      cardholder_name: opts.cardholder_name || 'Test User',
      expiry_date: opts.expiry_date || '08/23',
      card_brand: opts.card_brand || 'Visa'
    }
  }

  if (opts.includeRefundSummary) {
    data.refund_summary = {
      status: opts.refund_summary_status || 'unavailable',
      user_external_id: opts.user_external_id || null,
      amount_available: opts.refund_summary_available || 20000,
      amount_submitted: opts.amount_submitted || 0
    }
  }

  if (opts.includeSettlementSummary) {
    data.settlement_summary = {
      capture_submit_time: opts.capture_submit_time || null,
      captured_date: opts.captured_date || null
    }
  }

  if (opts.corporate_card_surcharge) {
    data.corporate_card_surcharge = opts.corporate_card_surcharge
    data.total_amount = opts.total_amount
  }
  if (opts.fee) data.fee = opts.fee
  if (opts.net_amount) data.net_amount = opts.net_amount
  if (opts.wallet_type) data.wallet_type = opts.wallet_type
  if (opts.metadata) data.metadata = opts.metadata

  return data
}

module.exports = {
  validTransactionSummaryResponse: () => {
    let data = {
      successful_payments: { count: 1, total_in_pence: 2 },
      refunded_payments: { count: 3, total_in_pence: 4 },
      net_income: { total_in_pence: 5 }
    }

    return {
      getPactified: () => pactRegister.pactify(data),
      getPlain: () => data
    }
  },
  validTransactionsResponse: (opts = {}) => {
    opts.includeSearchResultCardDetails = true
    const results = lodash.flatMap(opts.transactions, buildTransactionDetails(opts))

    const data = {
      total: opts.transactions.length,
      count: opts.transactions.length,
      page: opts.page || 1,
      results: results
    }

    return {
      getPactified: () => pactRegister.pactify(data),
      getPlain: () => data
    }
  },
  validTransactionDetailsResponse: (opts = {}) => {
    opts.includeCardDetails = true
    opts.includeRefundSummary = true
    opts.includeSettlementSummary = true
    const data = buildTransactionDetails(opts)

    return {
      getPactified: () => pactRegister.pactify(data),
      getPlain: () => data
    }
  },
  validTransactionCreatedDetailsResponse: (opts = {}) => {
    opts.includeRefundSummary = true
    opts.includeSettlementSummary = true
    const data = buildTransactionDetails(opts)

    return {
      getPactified: () => pactRegister.pactify(data),
      getPlain: () => data
    }
  },
  validChargeEventsResponse: (opts = {}) => {
    const defaultEvents = [
      buildChargeEventWithDefaults({
        amount: opts.amount,
        updated: '2018-05-01T13:27:00.063Z'
      }),
      buildChargeEventWithDefaults({
        amount: opts.amount,
        updated: '2018-05-01T13:27:00.974Z'
      }),
      buildChargeEventWithDefaults({
        state: { status: 'failed' },
        amount: opts.amount,
        updated: '2018-05-01T13:27:18.126Z'
      })
    ]

    const events = opts.events ? lodash.flatMap(opts.events, buildChargeEventWithDefaults) : defaultEvents

    const data = {
      transaction_id: opts.transaction_id || 'ht439nfg2l1e303k0dmifrn4fc',
      events: events
    }

    return {
      getPactified: () => pactRegister.pactify(data),
      getPlain: () => data
    }
  },
  validTransactionRefundRequest: (opts = {}) => {
    const data = {
      amount: opts.amount || 101,
      refund_amount_available: opts.refund_amount_available || 100,
      user_external_id: opts.user_external_id || '3b7b5f33-24ea-4405-88d2-0a1b13efb20c'
    }

    return {
      getPactified: () => pactRegister.pactify(data),
      getPlain: () => data
    }
  },
  invalidTransactionRefundResponse: (opts = {}) => {
    let data = {
      reason: opts.reason || 'amount_not_available'
    }

    return {
      getPactified: () => pactRegister.pactify(data),
      getPlain: () => data
    }
  },
  validTransactionEventsResponse: (opts = {}) => {
    const data = {
      transaction_id: opts.transaction_id || 'ht439nfg2l1e303k0dmifrn4fc',
      events: (opts.payment_states) ? buildPaymentEvents(opts) : []
    }

    return {
      getPactified: () => pactRegister.pactify(data),
      getPlain: () => data
    }
  }
}
