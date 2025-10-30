import LedgerClient from '@services/clients/pay/LedgerClient.class'
import { LedgerTransactionParams, LedgerTransactionParamsData } from '@services/clients/pay/interfaces/ledger-client'
import loggerFactory from '../utils/logger'
import getQueryStringForParams from '@utils/simplified-account/get-query-string-for-params'
import qs from 'qs'

const logger = loggerFactory(__filename)
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

const searchTransactions = async (gatewayAccountId: number, currentPage: number, pageSize: number) => {
  const queryParams: LedgerTransactionParams = {
    accountIds: [gatewayAccountId],
    displaySize: pageSize,
    page: currentPage,
  }
  return await ledgerClient.transactions.search(new LedgerTransactionParamsData(queryParams))
}

const getEvents = async (transactionExternalId: string, gatewayAccountId: number) =>
  await ledgerClient.transactions.events(transactionExternalId, gatewayAccountId)

const getDisputes = async (transactionExternalId: string, gatewayAccountId: number) =>
  await ledgerClient.transactions.disputes(transactionExternalId, gatewayAccountId)

interface Filters {
  fromDate?: string
  toDate?: string
  gatewayPayoutId?: string
  payment_states?: string
  refund_states?: string
  dispute_states?: string
  [key: string]: unknown
}

interface User {
  numberOfLiveServices?: number
  [key: string]: unknown
}

const csvSearchUrl = function csvSearchParams(
  filters: Record<string, unknown>,
  gatewayAccountIds: string[] = []
): string {
  const params = {
    account_id: gatewayAccountIds,
  }

  const formatOptions: qs.IStringifyOptions = { arrayFormat: 'comma' }
  const formattedParams = qs.stringify(params, formatOptions)

  const formattedFilterParams = getQueryStringForParams(filters, true, true, true)
  return `${process.env.LEDGER_URL}/v1/transaction?${formattedParams}&${formattedFilterParams}`
}

const logCsvFileStreamComplete = (
  timestampStreamStart: number,
  filters: Filters,
  gatewayAccountIds: string[],
  user: User,
  allServiceTransactions: boolean,
  liveAccounts: boolean
): void => {
  const timestampStreamEnd = Date.now()
  logger.info('Completed file stream', {
    time_taken: timestampStreamEnd - timestampStreamStart,
    from_date: filters.fromDate,
    to_date: filters.toDate,
    gateway_payout_id: filters.gatewayPayoutId,
    payment_states: filters.payment_states,
    refund_states: filters.refund_states,
    dispute_states: filters.dispute_states,
    method: 'future',
    gateway_account_ids: gatewayAccountIds,
    multiple_accounts: gatewayAccountIds.length > 1,
    all_service_transactions: allServiceTransactions,
    user_number_of_live_services: user.numberOfLiveServices,
    is_live: liveAccounts,
    filters: Object.keys(filters).sort().join(', '),
  })
}

export {
  dashboardTransactionSummary,
  getTransaction,
  searchTransactions,
  getEvents,
  getDisputes,
  logCsvFileStreamComplete,
  csvSearchUrl,
}
