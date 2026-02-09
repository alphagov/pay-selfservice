import paths from '@root/paths'
import { getTransaction, getEvents, getDisputes } from '@services/transactions.service'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { Transaction } from '@models/transaction/Transaction.class'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const [transaction, events] = await Promise.all([
    getTransaction(req.params.transactionExternalId, req.account.id),
    getEvents(req.params.transactionExternalId, req.account.id),
  ])
  transaction._locals.links.bind(req.service.externalId, req.account.type)

  let disputes: Transaction[] = []
  if (transaction.disputed) {
    disputes = await getDisputes(req.params.transactionExternalId, req.account.id)
    disputes.forEach((tx) => tx._locals.links.bind(req.service.externalId, req.account.type))
  }

  // sort by most recent first
  events.sort((eventA, eventB) => (eventA.timestamp > eventB.timestamp ? -1 : 1))

  return response(req, res, 'simplified-account/services/transactions/detail/index', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.transactions.index,
      req.service.externalId,
      req.account.type
    ),
    events,
    transaction,
    dispute: disputes.length > 0 && disputes[0],
    pageID: `${transaction._locals.formatted.createdDate} - ${transaction.reference}`,
    oldView: formatAccountPathsFor(
      paths.account.transactions.detail,
      req.account.externalId,
      req.params.transactionExternalId
    ) as string,
    messages: res.locals.flash?.messages ?? [],
  })
}

export { get }
