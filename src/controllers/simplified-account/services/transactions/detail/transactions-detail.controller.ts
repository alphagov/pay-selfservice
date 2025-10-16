import paths from '@root/paths'
import { getTransaction, getEvents, getDisputes } from '@services/ledger.service'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import { response } from '@utils/response'
import {
  eventDetails,
  transactionDetails,
} from '@utils/simplified-account/services/transactions/transaction-presentation-utils'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

const DATESTAMP_FORMAT = 'dd LLL yyyy HH:mm:ss'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const transaction = await getTransaction(req.params.transactionExternalId, req.account.id)
  const events = await getEvents(req.params.transactionExternalId, req.account.id)
  const txGrouping = {
    transaction,
    events,
    ...(transaction.disputed && { dispute: (await getDisputes(req.params.transactionExternalId, req.account.id))[0] }),
  }
  return response(req, res, 'simplified-account/services/transactions/detail/index', {
    backLink: formatAccountPathsFor(paths.account.transactions.index, req.account.externalId) as string,
    transactionViewHelper: transactionDetails(txGrouping, req.service),
    events: eventDetails(txGrouping),
    transaction,
    pageID: `${transaction.createdDate.toFormat(DATESTAMP_FORMAT)} - ${transaction.reference}`,
    oldView: formatAccountPathsFor(
      paths.account.transactions.detail,
      req.account.externalId,
      req.params.transactionExternalId
    ) as string,
  })
}

export { get }
