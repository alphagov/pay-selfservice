import { response } from '@utils/response.js'
import paths from '@root/paths'
import { ServiceRequest, ServiceResponse } from "@utils/types/express";
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";

function get (req: ServiceRequest, res: ServiceResponse) {
  const context = {
    productsTab: false,
    createLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, req.service.externalId, req.account.type),
    prototypesLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type),
    backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.dashboard.index, req.service.externalId, req.account.type)
  }

  return response(req, res, 'dashboard/demo-service/index', context)
}

export {
  get
}
