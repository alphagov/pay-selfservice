import createLogger from '@utils/logger'
import paths from '@root/paths'
import { disableProduct } from '@services/products.service'
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import { ServiceRequest, ServiceResponse } from "@utils/types/express";
import { Message } from "@utils/types/express/Message";

const logger = createLogger(__filename)

async function post (req: ServiceRequest, res: ServiceResponse) {
  try {
    await disableProduct(req.account.id, req.params.productExternalId)
  } catch (err) {
    const error = err as Error
    logger.error(`Disable product failed - ${error.message}`)
    req.flash('messages', Message.GenericError('Something went wrong when deleting the prototype link. Please try again or contact support.'))
    return res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type))
  }

  req.flash('messages', Message.Success('Prototype link deleted'))
  return res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type))
}

export {
  post
}
