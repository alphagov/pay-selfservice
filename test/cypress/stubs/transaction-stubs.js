const getLedgerTransactionSuccess = function (opts) {
  return {
    name: 'getLedgerTransactionSuccess',
    opts: {
      ...opts.transactionDetails
    }
  }
}

const getLedgerEventsSuccess = function (opts) {
  return {
    name: 'getLedgerEventsSuccess',
    opts: {
      transaction_id: opts.transactionId,
      payment_states: opts.events
    }
  }
}

const getLedgerTransactionsSuccess = function (opts) {
  return {
    name: 'getLedgerTransactionsSuccess',
    opts: {
      page: opts.page || 1,
      display_size: opts.displaySize,
      transaction_length: opts.transactionLength || 1000,
      transaction_count: opts.transactionCount || 3,
      gateway_account_id: opts.gatewayAccountId,
      filters: opts.filters || {},
      transactions: opts.transactions || [],
      links: opts.links || {}
    }
  }
}

const postRefundSuccess = function (opts) {
  return {
    name: 'postRefundSuccess',
    opts: {
      gateway_account_id: opts.gatewayAccountId,
      charge_id: opts.transactionId,
      amount: opts.refundAmount,
      refund_amount_available: opts.refundAmountAvailable,
      user_external_id: opts.userExternalId,
      user_email: opts.userEmail,
      verifyTimesCalled: 1
    }
  }
}

const postRefundAmountNotAvailable = function (opts) {
  return {
    name: 'postRefundAmountNotAvailable',
    opts: {
      gateway_account_id: opts.gatewayAccountId,
      charge_id: opts.transactionId,
      amount: opts.refundAmount,
      refund_amount_available: opts.refundAmountAvailable,
      user_external_id: opts.userExternalId,
      user_email: opts.userEmail
    }
  }
}

module.exports = {
  getLedgerEventsSuccess,
  getLedgerTransactionSuccess,
  getLedgerTransactionsSuccess,
  postRefundSuccess,
  postRefundAmountNotAvailable
}
