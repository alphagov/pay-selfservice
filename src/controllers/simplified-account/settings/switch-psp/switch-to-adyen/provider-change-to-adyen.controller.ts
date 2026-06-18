import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

function get(req: ServiceRequest, res: ServiceResponse) {
  const feesPath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.switchPsp.switchToAdyen.adyenFees,
    req.service.externalId,
    req.account.type
  )

  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-adyen/provider-change', { feesPath })
}

export = {
  get,
}
