import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { searchTransactions } from '@services/transactions.service'
import { response } from '@utils/response'
import { isBritishSummerTime } from '@utils/dates'
import getPagination from '@utils/simplified-account/pagination'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

// async function get(req: ServiceRequest, res: ServiceResponse) {
//   const { service, account } = req
//   const gatewayAccountId = account.id
//   const results = await searchTransactions(gatewayAccountId)

//   return res.status(200).json(results)
// }

async function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req
  const gatewayAccountId = account.id
  const results = await searchTransactions(gatewayAccountId)
  const PAGE_SIZE = 10

  let currentPage = 1
  const filters = {}

  const transactionsUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.transactions.index,
    service.externalId,
    account.type
  )

  const totalPages = Math.ceil(results.total / PAGE_SIZE)
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages
  }

  const pagination = getPagination(currentPage, PAGE_SIZE, results.total, (pageNumber) => {
    let path = `${transactionsUrl}?page=${pageNumber}`
    if (filters && Object.keys(filters).length !== 0) {
      const filterParams = new URLSearchParams(filters).toString()
      path = `${path}&${filterParams}`
    }
    return path
  })

  return response(req, res, 'simplified-account/transactions/index', {
    results: results.transactions,
    isBST: isBritishSummerTime() as boolean,
    pagination: pagination
  })
}

export { get }