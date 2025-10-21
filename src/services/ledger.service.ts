import LedgerClient from '@services/clients/pay/LedgerClient.class'
import { LedgerTransactionParams, LedgerTransactionParamsData } from '@services/clients/pay/interfaces/ledger-client'

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

const searchTransactions = async (gatewayAccountId: number, currentPage: number, pageSize: number, filters?: Record<string, string>) => {
  const queryParams: LedgerTransactionParams = {
    accountIds: [gatewayAccountId],
    displaySize: pageSize,
    page: currentPage,
    ...filters,
  }
  return await ledgerClient.transactions.search(new LedgerTransactionParamsData(queryParams))
}

const getEvents = async (transactionExternalId: string, gatewayAccountId: number) =>
  await ledgerClient.transactions.events(transactionExternalId, gatewayAccountId)

const getDisputes = async (transactionExternalId: string, gatewayAccountId: number) =>
  await ledgerClient.transactions.disputes(transactionExternalId, gatewayAccountId)

export { dashboardTransactionSummary, getTransaction, searchTransactions, getEvents, getDisputes }
