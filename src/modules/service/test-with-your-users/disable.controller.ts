import createLogger from '@utils/logger'
import productsClient from '@services/clients/products.client.js'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { Message } from '@utils/types/express/Message'
import restrictToSandboxOrStripeTestAccount from '@middleware/restrict-to-sandbox-or-stripe-test-account'
import { LinksController } from '@root/modules/service/test-with-your-users/links.controller'
import { BaseModule } from '@root/modules/module'
import { experimentalFeature, simplifiedAccountStrategy } from '@middleware/simplified-account'
import userIsAuthorised from '@middleware/user-is-authorised'
import permission from '@middleware/permission'

const logger = createLogger(__filename)

export class DisableController extends BaseModule {
  static path = '/service/:serviceExternalId/account/:accountType/test-with-your-users/links/disable/:productExternalId'

  static middleware = [
    simplifiedAccountStrategy,
    userIsAuthorised,
    permission('transactions:read'),
    restrictToSandboxOrStripeTestAccount,
    experimentalFeature,
  ]

  static async get(req: ServiceRequest, res: ServiceResponse) {
    return productsClient.product
      .disable(req.account.id, req.params.productExternalId)
      .then(() => {
        req.flash('messages', Message.Success('Prototype link deleted'))
        return res.redirect(LinksController.formatPath(req.service.externalId, req.account.type))
      })
      .catch((err: Error) => {
        logger.error(`Disable product failed - ${err.message}`)
        req.flash(
          'messages',
          Message.GenericError(
            'Something went wrong when deleting the prototype link. Please try again or contact support.'
          )
        )
        return res.redirect(LinksController.formatPath(req.service.externalId, req.account.type))
      })
  }
}
