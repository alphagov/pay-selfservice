import { response } from '@utils/response.js'
import paths from '@root/paths'
import productsClient from '@services/clients/products.client.js'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import restrictToSandboxOrStripeTestAccount from '@middleware/restrict-to-sandbox-or-stripe-test-account'
import { experimentalFeature, simplifiedAccountStrategy } from '@middleware/simplified-account'
import userIsAuthorised from '@middleware/user-is-authorised'
import permission from '@middleware/permission'
import { BaseModule } from '@root/modules/module'

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
    const prototypeProducts = await productsClient.product.getByGatewayAccountIdAndType(
      `${req.account.id}`,
      'PROTOTYPE'
    )

    const context = {
      messages: res.locals?.flash?.messages ?? [],
      productsTab: true,
      createLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.create,
        req.service.externalId,
        req.account.type
      ),
      indexLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.index,
        req.service.externalId,
        req.account.type
      ),
      prototypesLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.links,
        req.service.externalId,
        req.account.type
      ),
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.index,
        req.service.externalId,
        req.account.type
      ),
      productsLength: prototypeProducts.length,
      products: prototypeProducts,
    }

    return response(req, res, 'modules/service/test-with-your-users/links/links', context)
  }
}
