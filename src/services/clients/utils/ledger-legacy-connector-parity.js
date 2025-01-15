const legacyConnectorEventsParity = (transactionEvents) => {
  transactionEvents.events = transactionEvents.events.map(event => {
    return Object.assign({
      type: event.resource_type.toLowerCase(),
      updated: event.timestamp,
      ...(event.data.refunded_by) && { submitted_by: event.data.refunded_by }
    }, event)
  })
  return transactionEvents
}

const legacyConnectorTransactionParity = (transaction) => {
  if (transaction.refund_summary && transaction.refund_summary.amount_refunded) {
    transaction.refund_summary.amount_submitted = transaction.refund_summary.amount_refunded
  }

  if (transaction.refund_summary === undefined) {
    transaction.refund_summary = {}
  }

  if (transaction.refunded_by) {
    transaction.refund_summary.user_external_id = transaction.refunded_by
  }

  transaction.charge_id = transaction.transaction_id

  const transactionType = transaction.transaction_type && transaction.transaction_type.toLowerCase()
  if (transactionType === 'refund' || transactionType === 'dispute') {
    if (transaction.payment_details !== undefined && transaction.payment_details !== null) {
      const paymentDetails = transaction.payment_details
      transaction.charge_id = transaction.parent_transaction_id
      transaction.reference = paymentDetails.reference
      transaction.description = paymentDetails.description
      transaction.email = paymentDetails.email
      transaction.card_details = paymentDetails.card_details
    }
  }

  return transaction
}

const legacyConnectorTransactionSummaryParity = (transactionSummaryResult) => {
  if (typeof transactionSummaryResult === 'undefined') {
    return {}
  }
  return {
    successful_payments: {
      count: transactionSummaryResult.payments.count,
      total_in_pence: transactionSummaryResult.payments.gross_amount
    },
    refunded_payments: {
      count: transactionSummaryResult.refunds.count,
      total_in_pence: transactionSummaryResult.refunds.gross_amount
    },
    net_income: {
      total_in_pence: transactionSummaryResult.net_income
    }
  }
}

const legacyConnectorTransactionsParity = (searchTransactionsResult) => {
  const { results } = searchTransactionsResult
  const transactions = results.map(legacyConnectorTransactionParity)
  searchTransactionsResult.results = transactions
  return searchTransactionsResult
}

module.exports = { legacyConnectorEventsParity, legacyConnectorTransactionParity, legacyConnectorTransactionsParity, legacyConnectorTransactionSummaryParity }
