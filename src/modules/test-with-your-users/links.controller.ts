import { response } from '@utils/response.js'
import paths from '@root/paths'
import productsClient from '@services/clients/products.client.js'
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import { ServiceRequest, ServiceResponse } from "@utils/types/express";
import {
  Authorised,
  BaseModule,
  Experimental,
  Middleware,
  Path,
  Permission,
  ServiceRoute,
} from "@root/modules/app-module";
import restrictToSandboxOrStripeTestAccount from "@middleware/restrict-to-sandbox-or-stripe-test-account";

const PATH = '/service/:serviceExternalId/account/:accountType/test-with-your-users/links'

@ServiceRoute
@Authorised
@Permission('transactions:read')
@Middleware(restrictToSandboxOrStripeTestAccount)
@Experimental
@Path(PATH)
export class LinksModule implements BaseModule {
  async get (req: ServiceRequest, res: ServiceResponse) {
    const prototypeProducts = await productsClient.product.getByGatewayAccountIdAndType(`${req.account.id}`, 'PROTOTYPE')

    const context = {
      messages: res.locals?.flash?.messages ?? [],
      productsTab: true,
      createLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, req.service.externalId, req.account.type),
      indexLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.index, req.service.externalId, req.account.type),
      prototypesLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links, req.service.externalId, req.account.type),
      backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.index, req.service.externalId, req.account.type),
      productsLength: prototypeProducts.length,
      products: prototypeProducts
    }

    return response(req, res, 'simplified-account/services/test-with-your-users/index', context)
  }
}

