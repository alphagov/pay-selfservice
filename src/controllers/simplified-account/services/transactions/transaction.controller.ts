import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { searchTransactions } from '@services/transactions.service'
import { response } from '@utils/response'
import { isBritishSummerTime } from '@utils/dates'

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

  return response(req, res, 'simplified-account/transactions/index', {
    results: results.transactions,
    isBST: isBritishSummerTime() as boolean
  })
}

export { get }