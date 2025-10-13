import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import lodash from 'lodash'
import { response } from '@utils/response'
import { SESSION_KEY } from '../constants'
import { BaseModule } from '@root/modules/module'
import restrictToSandboxOrStripeTestAccount from '@middleware/restrict-to-sandbox-or-stripe-test-account'
import { experimentalFeature, simplifiedAccountStrategy } from '@middleware/simplified-account'
import userIsAuthorised from '@middleware/user-is-authorised'
import permission from '@middleware/permission'
import { TestWithYourUsersModule } from '@modules/service/test-with-your-users/index/index.controller'

export class ConfirmController extends BaseModule {
  static path = '/service/:serviceExternalId/account/:accountType/test-with-your-users/confirm'

  static middleware = [
    simplifiedAccountStrategy,
    userIsAuthorised,
    permission('transactions:read'),
    restrictToSandboxOrStripeTestAccount,
    experimentalFeature,
  ]

  static get(req: ServiceRequest, res: ServiceResponse) {
    const prototypeLink = lodash.get(req, SESSION_KEY, '')

    const context = {
      prototypeLink,
      prototypesLink: TestWithYourUsersModule.Links.formatPath(req.service.externalId, req.account.type),
    }

    return response(req, res, 'modules/service/test-with-your-users/confirm/confirm', context)
  }
}
