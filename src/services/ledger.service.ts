import LedgerClient from '@services/clients/pay/LedgerClient.class'

const ledgerClient = new LedgerClient()

export const dashboardTransactionSummary = async (gatewayAccountId: number, fromDateTime: string, toDateTime: string) => {
  const transactionSummary = await ledgerClient.transactionSummary(gatewayAccountId, fromDateTime, toDateTime)
  return {
    successfulPayments: {
      count: transactionSummary.payments.count,
      totalInPence: transactionSummary.payments.grossAmount
    },
    refundedPayments: {
      count: transactionSummary.refunds.count,
      totalInPence: transactionSummary.refunds.grossAmount
    },
    netIncome: {
      totalInPence: transactionSummary.netIncome
    }
  }
}
