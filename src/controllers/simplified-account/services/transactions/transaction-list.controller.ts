import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { searchTransactions } from '@services/ledger.service'
import { response } from '@utils/response'
import { isBritishSummerTime } from '@utils/dates'
import getPagination from '@utils/simplified-account/pagination'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { getAllCardTypes } from '@services/card-types.service'
import lodash from 'lodash'
import {
  statusFriendlyNames,
  getFriendlyStatus,
  statusFriendlyNamesWithDisputes,
  ConnectorStates,
} from '@models/ledger/types/status'
import { getPeriodUKDateTimeRange, Period } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { displayStatesToConnectorStates } from '@utils/simplified-account/services/transactions/transaction-status-utils'

const getUrlGenerator = (filters: Record<string, string>, transactionsUrl: string) => {
  const getPath = (pageNumber: number) => {
    const params = new URLSearchParams(filters)
    params.set('page', String(pageNumber))
    return `${transactionsUrl}?${params.toString()}`
  }

  return { path: getPath }
}

async function get(req: ServiceRequest, res: ServiceResponse) {
  const isStripeAccount = req.account.paymentProvider === 'stripe'
  const gatewayAccountId = req.account.id
  const PAGE_SIZE = 20

  const transactionsUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.transactions.index,
    req.service.externalId,
    req.account.type
  )

  let currentPage = 1
  const pageQuery = req.query.page
  if (pageQuery) {
    const pageNumber = Number(pageQuery)
    if (!isNaN(pageNumber) && pageNumber >= 1) {
      currentPage = pageNumber
    }
  }

  const dateRange = getPeriodUKDateTimeRange(req.query.dateFilter as Period)

  function convertStateFilter(stateFilters: string[]): ConnectorStates {
    return displayStatesToConnectorStates(stateFilters)
  }

  const stateFilters = convertStateFilter(req.query.state as string[])

  const includeDisputeStatuses = isStripeAccount
  const statusNames = includeDisputeStatuses ? statusFriendlyNamesWithDisputes : statusFriendlyNames

  const filters = {
    ...(req.query.cardholderName && { cardholderName: req.query.cardholderName as string }),
    ...(req.query.lastDigitsCardNumber && { lastDigitsCardNumber: req.query.lastDigitsCardNumber as string }),
    ...(req.query.metadataValue && { metadataValue: req.query.metadataValue as string }),
    ...(req.query.brand && { brand: req.query.brand as string }),
    ...(req.query.reference && { reference: req.query.reference as string }),
    ...(req.query.email && { email: req.query.email as string }),
    ...(req.query.dateFilter && {
      dateFilter: req.query.dateFilter as string,
      fromDate: dateRange.start.toISO()!,
      toDate: dateRange.end.toISO()!,
    }),
    ...(req.query.state && {
      state: req.query.state as string[],
      paymentStates: stateFilters.paymentStates,
      refundStates: stateFilters.refundStates,
      disputeStates: stateFilters.disputeStates,
    }),
  }

  const cardTypes = await getAllCardTypes()

  const eventStates = statusNames.map((state) => {
    return {
      value: state,
      text: state,
      selected: filters.state?.includes(state),
    }
  })

  const cardBrands = lodash.uniqBy(cardTypes, 'brand').map((card) => {
    return {
      value: card.brand,
      text: card.label === 'Jcb' ? card.label.toUpperCase() : card.label,
      selected: filters.brand === card.brand,
    }
  })

  const results = await searchTransactions(gatewayAccountId, currentPage, PAGE_SIZE, filters as Record<string, string>)

  const totalPages = Math.ceil(results.total / PAGE_SIZE)
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages
  }

  const { path } = getUrlGenerator(filters as Record<string, string>, transactionsUrl)

  const pagination = getPagination(currentPage, PAGE_SIZE, results.total, path)

  return response(req, res, 'simplified-account/transactions/index', {
    results: {
      ...results,
      transactions: results.transactions.map((transaction) => {
        const isRefund = transaction.transactionType === 'REFUND'
        const isWonDispute = transaction.transactionType === 'DISPUTE' && transaction.state.status === 'WON'
        const toDisplayAmount = (value?: number) => (value == null ? undefined : penceToPoundsWithCurrency(value))

        return {
          ...transaction,
          amountInPounds:
            isRefund || isWonDispute ? toDisplayAmount(-transaction.amount) : toDisplayAmount(transaction.amount),
          fee: toDisplayAmount(transaction.fee),
          netAmount: toDisplayAmount(transaction.netAmount),
          totalAmount: toDisplayAmount(transaction.totalAmount),
          corporateCardSurcharge: transaction.corporateCardSurcharge,
          email: isRefund ? transaction.data.payment_details?.email : transaction.email,
          reference: isRefund ? transaction.data.payment_details?.reference : transaction.reference,
          formattedStatus: getFriendlyStatus(transaction.transactionType, transaction.state.status),
          link: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.transactions.detail,
            req.service.externalId,
            req.account.type,
            transaction.externalId
          ),
        }
      }),
    },
    isBST: isBritishSummerTime(),
    pagination,
    filters,
    clearRedirect: transactionsUrl,
    isStripeAccount,
    cardBrands: [{ value: '', text: 'Any' }, ...cardBrands],
    statuses: [{ value: '', text: 'All' }, ...eventStates],
  })
}

export { get }
