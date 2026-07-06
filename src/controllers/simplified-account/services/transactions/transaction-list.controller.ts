import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { searchTransactions } from '@services/transactions.service'
import { response } from '@utils/response'
import { isBritishSummerTime } from '@utils/dates'
import { getPagination } from '@utils/simplified-account/pagination'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { getAllCardTypes } from '@services/card-types.service'
import lodash from 'lodash'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import {
  StripeStatusFilters,
  WorldpayStatusFilters,
} from '@utils/simplified-account/services/transactions/status-filters'
import { LEDGER_TRANSACTION_COUNT_LIMIT, MAX_TRANSACTIONS_PER_PAGE } from './constants'
import { Period } from '@utils/simplified-account/services/dashboard/datetime-utils'

const getUrlGenerator = (filters: Record<string, string>, transactionsUrl: string) => {
  const getPath = (pageNumber: number) => {
    const params = new URLSearchParams(filters)
    params.set('page', String(pageNumber))
    return `${transactionsUrl}?${params.toString()}`
  }

  return { path: getPath }
}

async function get(req: ServiceRequest, res: ServiceResponse) {
  const isStripe = req.account.paymentProvider === 'stripe'
  const gatewayAccountId = req.account.id
  const transactionSearchParams = TransactionSearchParams.fromSearchQuery(
    gatewayAccountId,
    req.query,
    true,
    MAX_TRANSACTIONS_PER_PAGE
  ).withDefaultDateFilter(Period.LAST_12_MONTHS)

  const transactionsUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.transactions.index,
    req.service.externalId,
    req.account.type
  )
  const [cardTypes, results] = await Promise.all([getAllCardTypes(), searchTransactions(transactionSearchParams)])
  results.transactions.forEach((transaction) =>
    transaction._locals.links.bind(req.service.externalId, req.account.type)
  )

  const statusFilters = isStripe ? StripeStatusFilters : WorldpayStatusFilters
  const eventStates = statusFilters.map((filter) => {
    return {
      value: filter.id,
      text: filter.friendly,
      selected: transactionSearchParams.state?.includes(filter.id),
    }
  })

  const cardBrands = lodash.uniqBy(cardTypes, 'brand').map((card) => {
    return {
      value: card.brand,
      text: card.label === 'Jcb' ? card.label.toUpperCase() : card.label,
      selected: transactionSearchParams.brand?.includes(card.brand),
    }
  })

  const totalPages = Math.ceil(results.total / MAX_TRANSACTIONS_PER_PAGE)
  const currentPage = Math.min(transactionSearchParams.page!, totalPages)

  const { path } = getUrlGenerator(req.query as Record<string, string>, transactionsUrl)
  const pagination = getPagination(currentPage, MAX_TRANSACTIONS_PER_PAGE, results.total, path)

  const downloadUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.transactions.downloadCsv,
    req.service.externalId,
    req.account.type
  )
  const downloadQueryString = transactionSearchParams.getQueryParams().toString()
  const downloadLink = downloadQueryString.length ? `${downloadUrl}?${downloadQueryString}` : downloadUrl
  const transactionCountWithinRange = results.total > 0 && results.total <= LEDGER_TRANSACTION_COUNT_LIMIT

  const showCsvDownload =
    req.user.hasPermission(req.service.externalId, 'transactions-download:read') &&
    (transactionCountWithinRange || transactionSearchParams.isRefinedSearch())

  req.session.transactionFilters = req.url.split('?')[1] || ''

  return response(req, res, 'simplified-account/transactions/index', {
    results,
    isBST: isBritishSummerTime(),
    pagination,
    filters: transactionSearchParams,
    clearRedirect: transactionsUrl,
    isStripe,
    cardBrands: [{ value: '', text: 'Any' }, ...cardBrands],
    statuses: eventStates,
    downloadLink,
    showCsvDownload,
    transactionCountWithinRange,
    maxTransactions: LEDGER_TRANSACTION_COUNT_LIMIT,
  })
}

export { get }
