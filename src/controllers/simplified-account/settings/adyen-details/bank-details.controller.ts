import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { markTaskAsComplete } from '@services/adyen-setup.service'
import { createBankDetails } from '@services/adyen-details.service'

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/adyen-details/bank-details', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

export interface CreateBankDetailsBody {
  sortCode: string
  accountNumber: string
}

async function post(req: ServiceRequest<CreateBankDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId

  await createBankDetails(req.body, req.service.externalId, req.account.type, switchingCredentialId)
  await markTaskAsComplete(req.service.externalId, req.account.type, switchingCredentialId, 'bankDetails')

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
