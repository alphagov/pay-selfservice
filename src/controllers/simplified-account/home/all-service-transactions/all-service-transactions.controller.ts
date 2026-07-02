import express, { NextFunction } from 'express'
import { response } from '@utils/response'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import { AuthenticatedRequest } from '@utils/types/express'
import { getAllCardTypes } from '@services/card-types.service'
import { searchTransactions, TransactionSearchResults } from '@services/transactions.service'
import { GatewayTimeoutError, NoServicesWithPermissionError, NotFoundError } from '@root/errors'
import { isBritishSummerTime } from '@utils/dates'
import paths from '@root/paths'
import {
  StripeStatusFilters,
  WorldpayStatusFilters,
} from '@utils/simplified-account/services/transactions/status-filters'
import lodash from 'lodash'
import PaymentProviders from '@models/constants/payment-providers'
import formattedPathFor from '@utils/simplified-account/format/format-paths-for'
import { getPagination } from '@utils/simplified-account/pagination'
import { ViewMode } from '@models/view-mode/ViewMode.class'
import { GatewayName } from '@models/gateway/gateway-name'
import { CardType } from '@models/card-type/CardType.class'
import {
  LEDGER_TRANSACTION_COUNT_LIMIT,
  MAX_TRANSACTIONS_PER_PAGE,
} from '@controllers/simplified-account/services/transactions/constants'
import { Period } from '@utils/simplified-account/services/dashboard/datetime-utils'

async function get(
  req: AuthenticatedRequest & { viewMode: ViewMode },
  res: express.Response<unknown, { flash?: Record<string, string[]> }>,
  next: NextFunction
) {
  if (!req.viewMode.hasServicesInMode && !req.viewMode.hasServicesInOppositeMode) {
    return next(
      new NoServicesWithPermissionError(
        'You do not have any associated services with rights to view these transactions.'
      )
    )
  }

  if (!req.viewMode.hasServicesInMode) {
    throw new NotFoundError(
      `User has no services in mode [${req.viewMode.modeName}] with permission [${req.viewMode.permission}]`
    )
  }

  const isStripe = req.viewMode.paymentProviders.includes(PaymentProviders.STRIPE)

  const transactionSearchParams = TransactionSearchParams.fromSearchQuery(
    req.viewMode.gatewayAccountIds,
    req.query,
    true,
    MAX_TRANSACTIONS_PER_PAGE
  ).withDefaultDateFilter(Period.LAST_12_MONTHS)

  let cardTypes: CardType[]
  let results: TransactionSearchResults
  try {
    const [_cardTypes, _results] = await Promise.all([getAllCardTypes(), searchTransactions(transactionSearchParams)])
    cardTypes = _cardTypes
    results = _results
  } catch (err) {
    if (err instanceof GatewayTimeoutError && err.gatewayName === GatewayName.LEDGER) {
      return res.redirect(req.viewMode._locals.links.allServiceTransactions.timeout)
    } else {
      throw err
    }
  }

  results.transactions.forEach((transaction) => {
    transaction._locals.links.bind(
      transaction.serviceExternalId ?? serviceIdPolyfill(transaction.gatewayAccountId, req.viewMode),
      req.viewMode.modeName
    )
    transaction._locals.links.bindToAllServices()
  })

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
  const transactionsUrl = formattedPathFor(paths.allServiceTransactions.simplifiedAccount.index, req.viewMode.modeName)
  const oppositeModeLink = formattedPathFor(
    paths.allServiceTransactions.simplifiedAccount.index,
    req.viewMode.oppositeModeName
  )
  const { path } = getUrlGenerator(req.query as Record<string, string>, transactionsUrl)
  const pagination = getPagination(currentPage, MAX_TRANSACTIONS_PER_PAGE, results.total, path)

  const downloadUrl = formattedPathFor(paths.allServiceTransactions.simplifiedAccount.download, req.viewMode.modeName)
  const downloadQueryString = transactionSearchParams.getQueryParams().toString()
  const downloadLink = downloadQueryString.length ? `${downloadUrl}?${downloadQueryString}` : downloadUrl
  const transactionCountWithinRange = results.total > 0 && results.total <= LEDGER_TRANSACTION_COUNT_LIMIT

  const showCsvDownload = transactionCountWithinRange || transactionSearchParams.isRefinedSearch()

  req.session.transactionFilters = req.url.split('?')[1] || ''

  return response(req, res, 'simplified-account/home/all-service-transactions/index', {
    modeFilter: req.viewMode.modeName,
    oppositeMode: req.viewMode.oppositeModeName,
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
    showOppositeModeLink: req.viewMode.hasServicesInOppositeMode,
    oppositeModeLink,
    transactionCountWithinRange,
    maxTransactions: LEDGER_TRANSACTION_COUNT_LIMIT,
  })
}

// some old transactions have no `service_id` field - this attempts to polyfill it from the gateway account
function serviceIdPolyfill(accountId: string, viewMode: ViewMode): string {
  const gatewayAccount = viewMode.gatewayAccounts.get(`${accountId}`)
  if (!gatewayAccount) {
    throw new Error(
      `Unable to determine service external ID from gateway account [${accountId}]. Gateway account is not attached to request.`
    )
  }
  return gatewayAccount.serviceId
}

const getUrlGenerator = (filters: Record<string, string>, transactionsUrl: string) => {
  const getPath = (pageNumber: number) => {
    const params = new URLSearchParams(filters)
    params.set('page', String(pageNumber))
    return `${transactionsUrl}?${params.toString()}`
  }

  return { path: getPath }
}

export { get }
