import { response } from '@utils/response.js'
import paths from '@root/paths'
import productsClient from '@services/clients/products.client.js'
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import { ServiceRequest, ServiceResponse } from "@utils/types/express";

async function get (req: ServiceRequest, res: ServiceResponse) {
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

export {
  get
}
