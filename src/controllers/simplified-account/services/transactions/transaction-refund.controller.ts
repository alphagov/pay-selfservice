import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { getTransaction } from '@services/ledger.service'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const transaction = await getTransaction(req.params.transactionExternalId, req.account.id)

  return response(req, res, 'simplified-account/services/transactions/refund', {
    transaction,
  })
}

function post(req: ServiceRequest, res: ServiceResponse) {
  res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.transactions.detail,
      req.service.externalId,
      req.account.type,
      req.params.transactionExternalId
    )
  )
}

export { get, post }
