import LedgerClient from '@services/clients/pay/LedgerClient.class'

const ledgerClient = new LedgerClient()

const dashboardTransactionSummary = async (gatewayAccountId: number, fromDateTime: string, toDateTime: string) => {
  const transactionSummary = await ledgerClient.reports.transactionsSummary(gatewayAccountId, fromDateTime, toDateTime)
  return {
    successfulPayments: {
      count: transactionSummary.payments.count,
      totalInPence: transactionSummary.payments.grossAmount,
    },
    refundedPayments: {
      count: transactionSummary.refunds.count,
      totalInPence: transactionSummary.refunds.grossAmount,
    },
    netIncome: {
      totalInPence: transactionSummary.netIncome,
    },
  }
}

const getTransaction = async (transactionExternalId: string, gatewayAccountId: number) =>
  await ledgerClient.transactions.get(transactionExternalId, gatewayAccountId)

const getEvents = async (transactionExternalId: string, gatewayAccountId: number) =>
  await ledgerClient.transactions.events(transactionExternalId, gatewayAccountId)

export { dashboardTransactionSummary, getTransaction, getEvents }
