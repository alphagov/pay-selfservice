const getLedgerPayoutSuccess = function (opts) {
  let stubOpts = {
    gateway_account_id: opts.gatewayAccountId,
    ...opts.payoutOpts
  }

  if (opts.payouts) {
    stubOpts.payouts = opts.payouts
  }

  return {
    name: 'getLedgerPayoutSuccess',
    opts: stubOpts
  }
}

module.exports = {
  getLedgerPayoutSuccess
}
