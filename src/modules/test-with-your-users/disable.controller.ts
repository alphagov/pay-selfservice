import createLogger from '@utils/logger'
import paths from '@root/paths'
import productsClient from '@services/clients/products.client.js'
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import { ServiceRequest, ServiceResponse } from "@utils/types/express";
import { Message } from "@utils/types/express/Message";
import {Authorised, Experimental, Middleware, Path, Permission, ServiceRoute} from "@root/modules/app-module";
import restrictToSandboxOrStripeTestAccount from "@middleware/restrict-to-sandbox-or-stripe-test-account";

const logger = createLogger(__filename)

const PATH = '/service/:serviceExternalId/account/:accountType/test-with-your-users/disable'

@ServiceRoute
@Authorised
@Permission('transactions:read')
@Middleware(restrictToSandboxOrStripeTestAccount)
@Experimental
@Path(PATH)
export class DisableModule {
  async post (req: ServiceRequest, res: ServiceResponse) {
    return productsClient.product.disable(req.account.id, req.params.productExternalId)
      .then(() => {
        req.flash('messages', Message.Success('Prototype link deleted'))
        res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type))
      })
      .catch((err: Error) => {
        logger.error(`Disable product failed - ${err.message}`)
        req.flash('messages', Message.GenericError('Something went wrong when deleting the prototype link. Please try again or contact support.'))
        res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type))
      })
  }
}
