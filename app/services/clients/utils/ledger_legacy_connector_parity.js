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

  if (transaction.transaction_type && transaction.transaction_type.toLowerCase() === 'refund') {
    if (transaction.parent_transaction !== undefined && transaction.parent_transaction !== null) {
      let charge = transaction.parent_transaction
      transaction.charge_id = charge.transaction_id
      transaction.gateway_transaction_id = charge.gateway_transaction_id
      transaction.reference = charge.reference
      transaction.description = charge.description
      transaction.email = charge.email
      transaction.card_details = charge.card_details
    }
  }

  return transaction
}

const legacyConnectorTransactionSummaryParity = (transactionSummaryResult) => {
  return {
    successful_payments: {
      count: transactionSummaryResult.payments.count,
      total_in_pence: transactionSummaryResult.payments.gross_amount
    },
    refunded_payments: {
      count: transactionSummaryResult.refunds.count,
      total_in_pence: transactionSummaryResult.refunds.gross_amount
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
