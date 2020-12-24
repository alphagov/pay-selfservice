'use strict'

const ledgerPayoutFixtures = require('../../fixtures/payout.fixtures')
const { stubBuilder } = require('./stub-builder')

function getLedgerPayoutSuccess (opts) {
  const path = '/v1/payout'
  return stubBuilder('GET', path, 200, {
    query: {
      gateway_account_id: opts.gatewayAccountId,
      state: 'paidout',
      page: (opts.payoutOpts && opts.payoutOpts.page) || 1,
      display_size: (opts.payoutOpts && opts.payoutOpts.display_size) || 15
    },
    response: ledgerPayoutFixtures.validPayoutSearchResponse(opts.payouts || [], opts.payoutOpts)
  })
}

module.exports = {
  getLedgerPayoutSuccess
}
