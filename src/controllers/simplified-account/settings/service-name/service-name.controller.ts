import edit from '@controllers/simplified-account/settings/service-name/edit/edit-service-name.controller'
import removeWelshServiceName from '@controllers/simplified-account/settings/service-name/remove-cy/remove-welsh-service-name.controller'
import type ServiceRequest from '@utils/types/express/ServiceRequest'
import type ServiceResponse from '@utils/types/express/ServiceResponse'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { response } from '@utils/response'

function get(req: ServiceRequest, res: ServiceResponse) {
  const context = {
    messages: res.locals.flash?.messages ?? [],
    serviceNameEn: req.service.serviceName.en,
    serviceNameCy: req.service.serviceName.cy,
    manageEn: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.serviceName.edit,
      req.service.externalId,
      req.account.type
    ),
    manageCy:
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.serviceName.edit,
        req.service.externalId,
        req.account.type
      ) + '?cy=true',
  }
  return response(
    req,
    res,
    'simplified-account/settings/service-name/index',
    context
  )
}

export = {
  get,
  edit,
  removeWelshServiceName,
}
