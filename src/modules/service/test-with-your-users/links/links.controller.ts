import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import restrictToSandboxOrStripeTestAccount from '@middleware/restrict-to-sandbox-or-stripe-test-account'
import { experimentalFeature, simplifiedAccountStrategy } from '@middleware/simplified-account'
import userIsAuthorised from '@middleware/user-is-authorised'
import permission from '@middleware/permission'
import { BaseModule } from '@root/modules/module'
import { getProducts } from '@services/products.service'
import { ProductType } from '@models/products/product-type'
import { TestWithYourUsersModule } from '@modules/service/test-with-your-users/index/index.controller'

export class LinksController extends BaseModule {
  static path = '/service/:serviceExternalId/account/:accountType/test-with-your-users/links'

  static middleware = [
    simplifiedAccountStrategy,
    userIsAuthorised,
    permission('transactions:read'),
    restrictToSandboxOrStripeTestAccount,
    experimentalFeature,
  ]

  static async get(req: ServiceRequest, res: ServiceResponse) {
    const prototypeProducts = await getProducts(req.account.id, ProductType.PROTOTYPE)

    const context = {
      messages: res.locals?.flash?.messages ?? [],
      createLink: TestWithYourUsersModule.Create.formatPath(req.service.externalId, req.account.type),
      indexLink: TestWithYourUsersModule.formatPath(req.service.externalId, req.account.type),
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.dashboard.index,
        req.service.externalId,
        req.account.type
      ),
      products: prototypeProducts,
    }

    return response(req, res, 'modules/service/test-with-your-users/links/links', context)
  }
}
