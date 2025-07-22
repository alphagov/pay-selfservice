import { response } from '@utils/response.js'
import paths from '@root/paths'
import { ServiceRequest, ServiceResponse } from "@utils/types/express";
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";

function get (req: ServiceRequest, res: ServiceResponse) {
  const context = {
    messages: res.locals?.flash?.messages ?? [],
    productsTab: false,
    createLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, req.service.externalId, req.account.type),
    prototypesLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type),
    backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.dashboard.index, req.service.externalId, req.account.type)
  }

  return response(req, res, 'simplified-account/services/test-with-your-users/index', context)
}

export {
  get
}
