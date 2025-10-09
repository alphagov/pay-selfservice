import lodash from 'lodash'
import { response } from '@utils/response.js'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { prototypeLinkSchema } from '@controllers/simplified-account/services/test-with-your-users/validation/prototype-link.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { createToken } from '@services/tokens.service'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'
import TokenUsageType from '@models/public-auth/token-usage-type'
import { CreateProductRequest } from '@models/products/CreateProductRequest.class'
import { createProduct } from '@services/products.service'
import { ProductType } from '@models/products/product-type'
import { SESSION_KEY } from '../constants'
import { demoPaymentSchema } from '@utils/simplified-account/validation/demo-payment.schema'
import { safeConvertPoundsStringToPence } from '@utils/currency-formatter'
import restrictToSandboxOrStripeTestAccount from '@middleware/restrict-to-sandbox-or-stripe-test-account'
import { ConfirmController } from '@root/modules/service/test-with-your-users/confirm/confirm.controller'
import { BaseModule } from '@root/modules/module'
import { experimentalFeature, simplifiedAccountStrategy } from '@middleware/simplified-account'
import userIsAuthorised from '@middleware/user-is-authorised'
import permission from '@middleware/permission'
import { RequestHandler } from 'express'

const PATH = '/service/:serviceExternalId/account/:accountType/test-with-your-users/create'

const postValidation = [
  prototypeLinkSchema.description.validate,
  demoPaymentSchema.paymentAmount.validate,
  prototypeLinkSchema.confirmationPage.validate,
]

interface CreatePrototypeLinkData {
  description: string
  paymentAmount: string
  confirmationPage: string
}

export class CreateController extends BaseModule {
  static path = PATH

  static middleware = [
    simplifiedAccountStrategy,
    userIsAuthorised,
    permission('transactions:read'),
    restrictToSandboxOrStripeTestAccount,
    experimentalFeature,
  ]

  static get(req: ServiceRequest, res: ServiceResponse) {
    const context = {
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.links,
        req.service.externalId,
        req.account.type
      ),
      confirmLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.testWithYourUsers.confirm,
        req.service.externalId,
        req.account.type
      ),
      ...lodash.get(req, 'session.pageData.createPrototypeLink', {}),
    }

    return response(req, res, 'modules/service/test-with-your-users/create/create', context)
  }

  static postMiddleware = [postValidation as unknown as RequestHandler]

  static async post(req: ServiceRequest<CreatePrototypeLinkData>, res: ServiceResponse) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const formattedErrors = formatValidationErrors(errors)
      return response(req, res, 'modules/service/test-with-your-users/views/create', {
        errors: {
          summary: formattedErrors.errorSummary,
          formErrors: formattedErrors.formErrors,
        },
        prototypeLinkData: {
          description: req.body.description,
          paymentAmount: req.body.paymentAmount,
          confirmationPage: req.body.confirmationPage,
        },
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.testWithYourUsers.index,
          req.service.externalId,
          req.account.type
        ),
      })
    }

    const parsedAmount = safeConvertPoundsStringToPence(req.body.paymentAmount)!

    const token = await createToken(
      new CreateTokenRequest()
        .withGatewayAccountId(`${req.account.id}`)
        .withServiceExternalId(req.service.externalId)
        .withServiceMode(req.account.type)
        .withDescription(`Token for Prototype: ${req.body.description}`)
        .withCreatedBy(req.user.email)
        .withTokenUsageType(TokenUsageType.PRODUCTS)
    )

    const prototypeLink = await createProduct(
      new CreateProductRequest()
        .withName(req.body.description)
        .withPrice(parsedAmount)
        .withReturnUrl(req.body.confirmationPage)
        .withType(ProductType.PROTOTYPE)
        .withGatewayAccountId(req.account.id)
        .withApiToken(token)
    )

    lodash.set(req, SESSION_KEY, prototypeLink.links.pay.href)

    return res.redirect(ConfirmController.formatPath(req.service.externalId, req.account.type))
  }
}
