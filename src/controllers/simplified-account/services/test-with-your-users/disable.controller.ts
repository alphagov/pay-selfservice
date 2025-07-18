import createLogger from '@utils/logger'
import paths from '@root/paths'
import productsClient from '@services/clients/products.client.js'
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import { ServiceRequest, ServiceResponse } from "@utils/types/express";
import { Message } from "@utils/types/express/Message";

const logger = createLogger(__filename)

async function post (req: ServiceRequest, res: ServiceResponse) {
  return productsClient.product.disable(req.account.id, req.params.productExternalId)
    .then(() => {
      req.flash('messages', Message.Success('Prototype link deleted'))
      res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type))
    })
    .catch((err) => {
      logger.error(`Disable product failed - ${err.message}`)
      req.flash('messages', Message.GenericError('Something went wrong when deleting the prototype link. Please try again or contact support.'))
      res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type))
    })
}

export {
  post
}
