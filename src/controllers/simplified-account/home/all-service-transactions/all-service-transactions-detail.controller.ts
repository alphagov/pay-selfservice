import paths, { formattedPathFor } from '@root/paths'
import { getTransaction, getEvents, getDisputes } from '@services/transactions.service'
import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { Transaction } from '@models/transaction/Transaction.class'
import { TITLE_FRIENDLY_DATE_TIME } from '@models/constants/time-formats'
import { ServiceRequestParams } from '@utils/types/express/ServiceRequest'

interface Params extends ServiceRequestParams {
  transactionExternalId: string
}

async function get(req: ServiceRequest<never, Params>, res: ServiceResponse) {
  req.serviceView.showHeader = false

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

  const transactionFilters = req.session.transactionFilters as string

  return response(req, res, 'simplified-account/services/all-service-transactions/detail/index', {
    backLink: `${formattedPathFor(paths.allServiceTransactions.simplifiedAccount.index, req.account.type)}${transactionFilters ? `?${transactionFilters}` : ''} `,
    events,
    transaction,
    dispute: disputes.length > 0 && disputes[0],
    pageID: `${transaction.createdDate.toFormat(TITLE_FRIENDLY_DATE_TIME)} - ${transaction.reference}`,
    messages: res.locals.flash?.messages ?? [],
  })
}

export { get }
