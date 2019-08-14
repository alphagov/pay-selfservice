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
  transaction.charge_id = transaction.transaction_id
  return transaction
}

const legacyConnectorTransactionsParity = (searchTransactionsResult) => {
  const { results } = searchTransactionsResult
  const transactions = results.map(legacyConnectorTransactionParity)
  searchTransactionsResult.results = transactions
  return searchTransactionsResult
}

module.exports = { legacyConnectorEventsParity, legacyConnectorTransactionParity, legacyConnectorTransactionsParity }
