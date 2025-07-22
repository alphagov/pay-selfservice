import lodash from 'lodash'
import { response } from'@utils/response.js'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import {ServiceRequest, ServiceResponse} from "@utils/types/express";

function get (req: ServiceRequest, res: ServiceResponse) {
  const context = {
    backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type),
    confirmLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.confirm,  req.service.externalId, req.account.type),
    ...lodash.get(req, 'session.pageData.createPrototypeLink', {})
  }

  return response(req, res, 'simplified-account/services/test-with-your-users/create', context)
}

export {
  get
}
