import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { searchTransactions } from '@services/transactions.service'
import { response } from '@utils/response'
import { isBritishSummerTime } from '@utils/dates'
import getPagination from '@utils/simplified-account/pagination'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'

const getUrlGenerator = (filters: Record<string, string>, serviceExternalId: string, accountType: string) => {
  const transactionsUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.transactions.index,
    serviceExternalId,
    accountType
  )

  return (pageNumber: number) => {
    let path = `${transactionsUrl}?page=${pageNumber}`
    if (filters && Object.keys(filters).length !== 0) {
      const filterParams = new URLSearchParams(filters).toString()
      path = `${path}&${filterParams}`
    }
    return path
  }
}

async function get(req: ServiceRequest, res: ServiceResponse) {
  const gatewayAccountId = req.account.id
  const PAGE_SIZE = 5
  // temporary to test pagination

  let currentPage = 1
  const pageQuery = req.query.page
  if (pageQuery) {
    const pageNumber = Number(pageQuery)
    if (!isNaN(pageNumber) && pageNumber >= 1) {
      currentPage = pageNumber
    }
  }
  const filters = {}
  const results = await searchTransactions(gatewayAccountId, currentPage, PAGE_SIZE)

  const totalPages = Math.ceil(results.total / PAGE_SIZE)
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages
  }

  const urlGenerator = getUrlGenerator(filters, req.service.externalId, req.account.type)

  const pagination = getPagination(currentPage, PAGE_SIZE, results.total, urlGenerator)

  const transactionsWithFee = results.transactions.map(transaction => {
    const calculatedFee = transaction.amount * 0.003
    const amountInPounds = transaction.amountInPounds()

    return {
      ...transaction,
      fee: penceToPoundsWithCurrency(calculatedFee),
      amountInPounds: amountInPounds,
      net_amount: penceToPoundsWithCurrency(transaction.amount - calculatedFee)
    }
  })
  // this is to enable testing and display of Stripe specific columns

  return response(req, res, 'simplified-account/transactions/index', {
    results: transactionsWithFee.map((transaction) => ({
      ...transaction,
      link: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.transactions.detail,
        req.service.externalId,
        req.account.type,
        transaction.transactionExternalId
      ),
    })),


    isBST: isBritishSummerTime(),
    pagination: pagination,
    isStripeAccount: true,
  })
}

export { get }
