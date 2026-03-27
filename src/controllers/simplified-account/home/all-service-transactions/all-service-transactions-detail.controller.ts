import paths, { formattedPathFor } from '@root/paths'
import { getTransaction, getEvents, getDisputes } from '@services/transactions.service'
import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { Transaction } from '@models/transaction/Transaction.class'
import { TITLE_FRIENDLY_DATE_TIME } from '@models/constants/time-formats'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const [transaction, events] = await Promise.all([
    getTransaction(req.params.transactionExternalId, req.account.id),
    getEvents(req.params.transactionExternalId, req.account.id),
  ])
  transaction._locals.links.bind(req.service.externalId, req.account.type)
  transaction._locals.links.bindToAllServices()

  let disputes: Transaction[] = []
  if (transaction.disputed) {
    disputes = await getDisputes(req.params.transactionExternalId, req.account.id)
    disputes.forEach((dispute) => dispute._locals.links.bind(req.service.externalId, req.account.type))
  }

  // sort by most recent first
  events.sort((eventA, eventB) => (eventA.timestamp > eventB.timestamp ? -1 : 1))

  return response(req, res, 'simplified-account/services/all-service-transactions/detail/index', {
    backLink: formattedPathFor(paths.allServiceTransactions.simplifiedAccount.index, req.account.type),
    events,
    transaction,
    dispute: disputes.length > 0 && disputes[0],
    pageID: `${transaction.createdDate.toFormat(TITLE_FRIENDLY_DATE_TIME)} - ${transaction.reference}`,
    messages: res.locals.flash?.messages ?? [],
  })
}

export { get }
