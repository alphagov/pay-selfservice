import {ServiceRequest, ServiceResponse} from "@utils/types/express";
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import paths from "@root/paths";
import lodash from "lodash";
import {response} from "@utils/response";
import { SESSION_KEY } from "./constants";
import {
  Authorised,
  BaseModule, Experimental, Middleware, Path,
  Permission,
  ServiceRoute,
} from "@root/modules/app-module";
import restrictToSandboxOrStripeTestAccount from "@middleware/restrict-to-sandbox-or-stripe-test-account";


const PATH = '/service/:serviceExternalId/account/:accountType/test-with-your-users/confirm'

@ServiceRoute
@Authorised
@Permission('transactions:read')
@Middleware(restrictToSandboxOrStripeTestAccount)
@Experimental
@Path(PATH)
export class ConfirmModule extends BaseModule {
  get (req: ServiceRequest, res: ServiceResponse) {
    const prototypeLink = lodash.get(req, SESSION_KEY, '')

    const context = {
      prototypeLink,
      backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links, req.service.externalId, req.account.type),
      prototypesLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links, req.service.externalId, req.account.type),
    }

    return response(req, res, 'simplified-account/services/test-with-your-users/confirm', context)
  }
}
