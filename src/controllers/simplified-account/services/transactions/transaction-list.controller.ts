import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { searchTransactions } from '@services/transactions.service'
import { response } from '@utils/response'
import { isBritishSummerTime } from '@utils/dates'
import getPagination from '@utils/simplified-account/pagination'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { getAllCardTypes } from '@services/card-types.service'
import lodash from 'lodash'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import {
  StripeStatusFilters,
  WorldpayStatusFilters,
} from '@utils/simplified-account/services/transactions/status-filters'

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
  const transactionSearchParams = TransactionSearchParams.fromSearchQuery(gatewayAccountId, PAGE_SIZE, req.query)

  const transactionsUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.transactions.index,
    req.service.externalId,
    req.account.type
  )
  const [cardTypes, results] = await Promise.all([getAllCardTypes(), searchTransactions(transactionSearchParams)])
  results.transactions.forEach((transaction) =>
    transaction._locals.links.bind(req.service.externalId, req.account.type)
  )

  const statusFilters = isStripeAccount ? StripeStatusFilters : WorldpayStatusFilters
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
      selected: transactionSearchParams.brand === card.brand,
    }
  })

  const totalPages = Math.ceil(results.total / PAGE_SIZE)
  const currentPage = Math.min(transactionSearchParams.currentPage, totalPages)

  const { path } = getUrlGenerator(req.query as Record<string, string>, transactionsUrl)
  const pagination = getPagination(currentPage, PAGE_SIZE, results.total, path)

  return response(req, res, 'simplified-account/transactions/index', {
    results,
    isBST: isBritishSummerTime(),
    pagination,
    filters: transactionSearchParams,
    clearRedirect: transactionsUrl,
    isStripeAccount,
    cardBrands: [{ value: '', text: 'Any' }, ...cardBrands],
    statuses: eventStates,
  })
}

export { get }
