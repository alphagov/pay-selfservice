'use strict'

module.exports = {
  validTransactionRefundRequest: (opts = {}) => {
    return {
      amount: opts.amount || 101,
      refund_amount_available: opts.refund_amount_available || 100,
      user_external_id: opts.user_external_id || '3b7b5f33-24ea-4405-88d2-0a1b13efb20c',
      user_email: opts.user_email || 'foo@example.com'
    }
  },
  invalidTransactionRefundResponse: (opts = {}) => {
    return {
      reason: opts.reason || 'amount_not_available',
      error_identifier: opts.error_identifier || 'REFUND_NOT_AVAILABLE'
    }
  }
}
