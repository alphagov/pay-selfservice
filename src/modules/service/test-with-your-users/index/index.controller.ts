import { response } from '@utils/response.js'
import paths from '@root/paths'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import restrictToSandboxOrStripeTestAccount from '@middleware/restrict-to-sandbox-or-stripe-test-account'
import { BaseModule } from '@root/modules/module'
import { experimentalFeature, simplifiedAccountStrategy } from '@middleware/simplified-account'
import userIsAuthorised from '@middleware/user-is-authorised'
import permission from '@middleware/permission'

import { ConfirmController } from '../confirm/confirm.controller'
import { DisableController } from '../disable/disable.controller'
import { LinksController } from '../links/links.controller'
import { CreateController } from '../create/create.controller'

export class TestWithYourUsersModule extends BaseModule {
  static path = '/service/:serviceExternalId/account/:accountType/test-with-your-users'

  static middleware = [
    simplifiedAccountStrategy,
    userIsAuthorised,
    permission('transactions:read'),
    restrictToSandboxOrStripeTestAccount,
    experimentalFeature,
  ]

  static get(req: ServiceRequest, res: ServiceResponse) {
    const context = {
      messages: res.locals?.flash?.messages ?? [],
      productsTab: false,
      createLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.create,
        req.service.externalId,
        req.account.type
      ),
      prototypesLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.links,
        req.service.externalId,
        req.account.type
      ),
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.dashboard.index,
        req.service.externalId,
        req.account.type
      ),
    }

    return response(req, res, 'modules/service/test-with-your-users/index/index', context)
  }

  static Confirm = ConfirmController
  static Create = CreateController
  static Disable = DisableController
  static Links = LinksController
}
