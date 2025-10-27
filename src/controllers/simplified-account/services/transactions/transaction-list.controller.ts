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

const getUrlGenerator = (filters: Record<string, string>, serviceExternalId: string, accountType: string) => {
  const transactionsUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.transactions.index,
    serviceExternalId,
    accountType
  )

  const getPath = (pageNumber: number) => {
    let path = `${transactionsUrl}?page=${pageNumber}`
    if (filters && Object.keys(filters).length !== 0) {
      const filterParams = new URLSearchParams(filters).toString()
      path = `${path}&${filterParams}`
    }
    return path
  }

  return {
    transactionsUrl: transactionsUrl,
    path: getPath,
  }
}

async function get(req: ServiceRequest, res: ServiceResponse) {
  const gatewayAccountId = req.account.id
  const PAGE_SIZE = 20

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
  const results = await searchTransactions(gatewayAccountId, currentPage, PAGE_SIZE, filters)
  const cardTypes = await getAllCardTypes()

  const cardBrands = lodash.uniqBy(cardTypes, 'brand').map((card) => {
    return {
      value: card.brand,
      text: card.label === 'Jcb' ? card.label.toUpperCase() : card.label,
      selected: filters.brand === card.brand,
    }
  })

  const totalPages = Math.ceil(results.total / PAGE_SIZE)
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages
  }

  const { transactionsUrl, path } = getUrlGenerator(filters, req.service.externalId, req.account.type)

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
