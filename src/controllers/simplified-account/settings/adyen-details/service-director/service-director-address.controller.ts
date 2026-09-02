import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/adyen-details/service-director/address', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.serviceDirector.details,
      req.service.externalId,
      req.account.type
    ),
  })
}

export { get }
