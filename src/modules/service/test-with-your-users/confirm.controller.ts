import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import lodash from 'lodash'
import { response } from '@utils/response'
import { SESSION_KEY } from './constants'
import { BaseModule } from '@root/modules/module'
import restrictToSandboxOrStripeTestAccount from '@middleware/restrict-to-sandbox-or-stripe-test-account'
import { experimentalFeature, simplifiedAccountStrategy } from '@middleware/simplified-account'
import userIsAuthorised from '@middleware/user-is-authorised'
import permission from '@middleware/permission'

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
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.links,
        req.service.externalId,
        req.account.type
      ),
      prototypesLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.links,
        req.service.externalId,
        req.account.type
      ),
    }

    return response(req, res, 'simplified-account/services/test-with-your-users/confirm', context)
  }
}
