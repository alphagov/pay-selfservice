import { response } from '@utils/response.js'
import { formatSimplifiedAccountPathsFor } from '@utils/simplified-account/format'
import paths from '@root/paths'
import { ServiceRequest, ServiceResponse } from "@utils/types/express";

function get (req: ServiceRequest, res: ServiceResponse) {
  const context = {
    productsTab: false,
    createLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, req.service.externalId, req.account.type),
    prototypesLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type),
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.dashboard.index, req.service.externalId, req.account.type)
  }

  return response(req, res, 'dashboard/demo-service/index', context)
}

export {
  get
}
