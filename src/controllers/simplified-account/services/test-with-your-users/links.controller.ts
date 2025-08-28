import {response} from '@utils/response'
import paths from '@root/paths'
import {getProducts} from '@services/products.service'
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import {ServiceRequest, ServiceResponse} from "@utils/types/express";
import { ProductType } from "@models/products/product-type";

async function get (req: ServiceRequest, res: ServiceResponse) {
  const prototypeProducts = await getProducts(req.account.id, ProductType.PROTOTYPE)

  const context = {
    messages: res.locals?.flash?.messages ?? [],
    createLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, req.service.externalId, req.account.type),
    indexLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.index, req.service.externalId, req.account.type),
    prototypesLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links, req.service.externalId, req.account.type),
    backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.index, req.service.externalId, req.account.type),
    products: prototypeProducts
  }

  return response(req, res, 'simplified-account/services/test-with-your-users/links', context)
}

export {
  get
}
