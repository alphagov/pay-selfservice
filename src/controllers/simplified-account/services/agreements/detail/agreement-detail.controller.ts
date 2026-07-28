import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { getAgreement, getLatestTransactionsForAgreement } from '@services/agreements.service'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const agreementsFilter = req.session.agreementsFilter as string
  const agreement = await getAgreement(req.params.agreementExternalId, req.service.externalId)
  const agreementTxs = await getLatestTransactionsForAgreement(req.account.id, agreement.externalId)
  return response(req, res, 'simplified-account/services/agreements/detail', {
    backLink: `${formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.agreements.index,
      req.service.externalId,
      req.account.type
    )}${agreementsFilter ? `?${agreementsFilter}` : ''}`,
    agreement,
    transactions: agreementTxs.transactions,
    showCancelAgreementFunctionality:
      req.user.hasPermission(req.service.externalId, 'agreements:update') && agreement.status === 'ACTIVE',
    cancelAgreementLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.agreements.cancel,
      req.service.externalId,
      req.account.type,
      agreement.externalId
    ),
    allAgreementTransactionsLink: `${formatServiceAndAccountPathsFor(paths.simplifiedAccount.transactions.index, req.service.externalId, req.account.type)}?agreementId=${agreement.externalId}`,
  })
}

export { get }
