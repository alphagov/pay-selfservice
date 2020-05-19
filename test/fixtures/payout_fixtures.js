'use strict'
const pactBase = require('./pact_base')
const pact = pactBase()

function buildPayout (gatewayAccountId) {
  return {
    gateway_payout_id: 'some-gateway-payout-id',
    gateway_account_id: gatewayAccountId || 1,
    amount: 10000,
    created_date: '2019-01-29T08:00:00.000000Z',
    paid_out_date: '2019-01-29T11:00:00.000000Z',
    state: {
      status: 'paidout',
      finshed: true
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
  validPayoutSearchResponse: (gatewayAccountId) => {
    const payouts = [
      buildPayout(gatewayAccountId)
    ]
    const response = {
      results: payouts,
      total: payouts.length,
      count: payouts.length,
      page: 1
    }
    return decoratePactOptions(response)
  }
}
