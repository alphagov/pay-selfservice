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
import { PaymentStatusFriendlyNames } from '@models/ledger/types/status'

const getUrlGenerator = (filters: Record<string, string>, transactionsUrl: string) => {
  const getPath = (pageNumber: number) => {
    const params = new URLSearchParams(filters)
    params.set('page', String(pageNumber))
    return `${transactionsUrl}?${params.toString()}`
  }

  return { path: getPath }
}

async function get(req: ServiceRequest, res: ServiceResponse) {
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
  const filters = {
    ...(req.query.cardholderName && { cardholderName: req.query.cardholderName as string }),
    ...(req.query.lastDigitsCardNumber && { lastDigitsCardNumber: req.query.lastDigitsCardNumber as string }),
    ...(req.query.metadataValue && { metadataValue: req.query.metadataValue as string }),
    ...(req.query.brand && { brand: req.query.brand as string }),
  }

  const cardTypes = await getAllCardTypes()

  const cardBrands = lodash.uniqBy(cardTypes, 'brand').map((card) => {
    return {
      value: card.brand,
      text: card.label === 'Jcb' ? card.label.toUpperCase() : card.label,
      selected: filters.brand === card.brand,
    }
  })

  const results = await searchTransactions(gatewayAccountId, currentPage, PAGE_SIZE, filters)

  const totalPages = Math.ceil(results.total / PAGE_SIZE)
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages
  }

  const { path } = getUrlGenerator(filters, transactionsUrl)

  const pagination = getPagination(currentPage, PAGE_SIZE, results.total, path)

  return response(req, res, 'simplified-account/transactions/index', {
    results: {
      ...results,
      transactions: results.transactions.map((transaction) => ({
        ...transaction,
        amountInPounds: penceToPoundsWithCurrency(transaction.amount),
        fee: transaction.fee ? penceToPoundsWithCurrency(transaction.fee) : undefined,
        netAmount: transaction.netAmount ? penceToPoundsWithCurrency(transaction.netAmount) : undefined,
        totalAmount: transaction.totalAmount ? penceToPoundsWithCurrency(transaction.totalAmount) : undefined,
        corporateCardSurcharge: transaction.corporateCardSurcharge,
        formattedState: PaymentStatusFriendlyNames[transaction.state.status],
        link: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.transactions.detail,
          req.service.externalId,
          req.account.type,
          transaction.externalId
        ),
      })),
    },

    isBST: isBritishSummerTime(),
    pagination: pagination,
    clearRedirect: transactionsUrl,
    isStripeAccount: req.account.paymentProvider === 'stripe',
    cardBrands: [{ value: '', text: 'Any' }, ...cardBrands],
    filters,
  })
}

export { get }
