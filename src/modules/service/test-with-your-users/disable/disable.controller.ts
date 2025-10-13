import createLogger from '@utils/logger'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { Message } from '@utils/types/express/Message'
import restrictToSandboxOrStripeTestAccount from '@middleware/restrict-to-sandbox-or-stripe-test-account'
import { BaseModule } from '@root/modules/module'
import { experimentalFeature, simplifiedAccountStrategy } from '@middleware/simplified-account'
import userIsAuthorised from '@middleware/user-is-authorised'
import permission from '@middleware/permission'
import { disableProduct } from '@services/products.service'
import { TestWithYourUsersModule } from '@modules/service/test-with-your-users/index/index.controller'

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
    try {
      await disableProduct(req.account.id, req.params.productExternalId)
    } catch (err) {
      const error = err as Error
      logger.error(`Disable product failed - ${error.message}`)
      req.flash(
        'messages',
        Message.GenericError(
          'Something went wrong when deleting the prototype link. Please try again or contact support.'
        )
      )
      return res.redirect(TestWithYourUsersModule.Links.formatPath(req.service.externalId, req.account.type))
    }

    req.flash('messages', Message.Success('Prototype link deleted'))
    return res.redirect(TestWithYourUsersModule.Links.formatPath(req.service.externalId, req.account.type))
  }
}
