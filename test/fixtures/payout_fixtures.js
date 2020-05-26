'use strict'
const pactBase = require('./pact_base')
const pact = pactBase()

function buildPayout (opts) {
  return {
    gateway_payout_id: opts.gatewayPayoutId || 'some-gateway-payout-id',
    gateway_account_id: opts.gatewayAccountId || 1,
    amount: opts.amount || 10000,
    created_date: opts.createdDate || '2019-01-29T08:00:00.000000Z',
    paid_out_date: opts.paidOutDate || '2019-01-29T11:00:00.000000Z',
    state: {
      status: 'paidout',
      finished: true
    }
  }
}

function decoratePactOptions (response) {
  return {
    getPactified: () => pact.pactify(response),
    getPlain: () => response
  }
}

module.exports = {
  validPayoutSearchResponse: (payoutOpts = []) => {
    const payouts = payoutOpts.map(buildPayout)
    const response = {
      results: payouts,
      total: payouts.length,
      count: payouts.length,
      page: 1
    }
    return decoratePactOptions(response)
  }
}
