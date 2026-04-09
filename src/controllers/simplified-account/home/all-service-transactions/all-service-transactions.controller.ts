import express, { NextFunction } from 'express'
import { response } from '@utils/response'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import { AuthenticatedRequest } from '@utils/types/express'
import { findGatewayAccountsByService } from '@services/gateway-accounts.service'
import { getAllCardTypes } from '@services/card-types.service'
import { searchTransactions } from '@services/transactions.service'
import { NoServicesWithPermissionError, NotFoundError } from '@root/errors'
import { isBritishSummerTime } from '@utils/dates'
import paths from '@root/paths'
import {
  StripeStatusFilters,
  WorldpayStatusFilters,
} from '@utils/simplified-account/services/transactions/status-filters'
import lodash from 'lodash'
import PaymentProviders from '@models/constants/payment-providers'
import formattedPathFor from '@utils/simplified-account/format/format-paths-for'
import getPagination from '@utils/simplified-account/pagination'

const LEDGER_TRANSACTION_COUNT_LIMIT = 5000

async function get(
  req: AuthenticatedRequest,
  res: express.Response<unknown, { flash?: Record<string, string[]> }>,
  next: NextFunction
) {
  const modeFilter = req.params.modeFilter === 'test' ? 'test' : 'live'
  const userServiceExternalIds = req.user.serviceRoles
    .filter((serviceRole) => serviceRole.hasPermission('transactions:read'))
    .map((serviceRole) => serviceRole.service)
    .map((service) => service.externalId)
  if (!userServiceExternalIds.length) {
    return next(
      new NoServicesWithPermissionError(
        'You do not have any associated services with rights to view these transactions.'
      )
    )
  }

  const allGatewayAccounts = await findGatewayAccountsByService(userServiceExternalIds)
  const gatewayAccountsByMode = allGatewayAccounts.filter((gatewayAccount) => gatewayAccount.type === modeFilter)
  const gatewayAccountIds = gatewayAccountsByMode.map((gatewayAccountData) => gatewayAccountData.id)
  const showOppositeModeLink = allGatewayAccounts.length > gatewayAccountsByMode.length

  if (!gatewayAccountIds.length && !req.params.modeFilter) {
    // no live gateway accounts
    return res.redirect(formattedPathFor(paths.allServiceTransactions.simplifiedAccount.index, 'test'))
  }

  if (!gatewayAccountsByMode.length) {
    throw new NotFoundError(`Could not retrieve any gateway accounts with provided parameters`)
  }

  const isStripe = gatewayAccountsByMode.some(
    (gatewayAccount) => gatewayAccount.paymentProvider === PaymentProviders.STRIPE
  )

  const PAGE_SIZE = 20
  const transactionSearchParams = TransactionSearchParams.fromSearchQuery(gatewayAccountIds, req.query, true, PAGE_SIZE)
  const [cardTypes, results] = await Promise.all([getAllCardTypes(), searchTransactions(transactionSearchParams)])
  results.transactions.forEach((transaction) => {
    transaction._locals.links.bind(transaction.serviceExternalId, modeFilter)
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

  const totalPages = Math.ceil(results.total / PAGE_SIZE)
  const currentPage = Math.min(transactionSearchParams.page!, totalPages)
  const transactionsUrl = formattedPathFor(paths.allServiceTransactions.simplifiedAccount.index, modeFilter)
  const oppositeMode = modeFilter === 'test' ? 'live' : 'test'
  const oppositeModeLink = formattedPathFor(paths.allServiceTransactions.simplifiedAccount.index, oppositeMode)
  const { path } = getUrlGenerator(req.query as Record<string, string>, transactionsUrl)
  const pagination = getPagination(currentPage, PAGE_SIZE, results.total, path)

  const downloadUrl = formattedPathFor(paths.allServiceTransactions.simplifiedAccount.download, modeFilter)
  const downloadQueryString = transactionSearchParams.getQueryParams().toString()
  const downloadLink = downloadQueryString.length ? `${downloadUrl}?${downloadQueryString}` : downloadUrl
  const transactionCountWithinRange = results.total > 0 && results.total <= LEDGER_TRANSACTION_COUNT_LIMIT
  const hasQueryParams = transactionSearchParams.getQueryParams().toString().length
  const showCsvDownload =
    transactionCountWithinRange || (hasQueryParams && results.total > LEDGER_TRANSACTION_COUNT_LIMIT)

  return response(req, res, 'simplified-account/home/all-service-transactions/index', {
    modeFilter,
    oppositeMode,
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
    showOppositeModeLink,
    oppositeModeLink,
  })
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
