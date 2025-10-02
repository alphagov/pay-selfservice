import paths from '@root/paths'
import { getTransaction, getEvents } from '@services/ledger.service'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import { response } from '@utils/response'
import {
  eventDetails,
  transactionDetails,
} from '@utils/simplified-account/services/transactions/transaction-presentation-utils'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const transaction = await getTransaction(req.params.transactionExternalId, req.account.id)
  const events = await getEvents(req.params.transactionExternalId, req.account.id)
  return response(req, res, 'simplified-account/services/transactions/detail/index', {
    backLink: formatAccountPathsFor(paths.account.transactions.index, req.account.externalId) as string,
    transaction: transactionDetails(transaction, req.service),
    events: eventDetails(events),
    data: events,
  })
}

export { get }
