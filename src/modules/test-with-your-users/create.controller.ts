import lodash from 'lodash'
import { response } from'@utils/response.js'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import {ServiceRequest, ServiceResponse} from "@utils/types/express";
import { prototypeLinkSchema } from "@controllers/simplified-account/services/test-with-your-users/validation/prototype-link.schema";
import {validationResult} from "express-validator";
import formatValidationErrors from "@utils/simplified-account/format/format-validation-errors";
import { createToken } from '@services/tokens.service'
import {CreateTokenRequest} from "@models/public-auth/CreateTokenRequest.class";
import TokenUsageType from "@models/public-auth/token-usage-type";
import {CreateProductRequest} from "@models/products/CreateProductRequest.class";
import { createProduct } from '@services/products.service'
import { PROTOTYPE } from '@utils/product-types'
import { SESSION_KEY } from "./constants";
import {demoPaymentSchema} from "@utils/simplified-account/validation/demo-payment.schema";
import {safeConvertPoundsStringToPence} from "@utils/currency-formatter";
import {
  Authorised,
  Experimental,
  Middleware,
  Path,
  Permission,
  Service,
  Validate
} from "@root/modules/app-module";
import restrictToSandboxOrStripeTestAccount from "@middleware/restrict-to-sandbox-or-stripe-test-account";
import {ConfirmModule} from "@root/modules/test-with-your-users/confirm.controller";

const PATH = '/service/:serviceExternalId/account/:accountType/test-with-your-users/create'

const postValidation = [
  prototypeLinkSchema.description.validate,
  demoPaymentSchema.paymentAmount.validate,
  prototypeLinkSchema.confirmationPage.validate
]

interface CreatePrototypeLinkData {
  description: string
  paymentAmount: string
  confirmationPage: string
}

@Service
@Authorised
@Permission('transactions:read')
@Middleware(restrictToSandboxOrStripeTestAccount)
@Experimental
@Path(PATH)
export class CreateModule {
  PATH = PATH

  get (req: ServiceRequest, res: ServiceResponse) {
    const context = {
      backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type),
      confirmLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.confirm,  req.service.externalId, req.account.type),
      ...lodash.get(req, 'session.pageData.createPrototypeLink', {})
    }

    return response(req, res, 'simplified-account/services/test-with-your-users/create', context)
  }

  @Validate(postValidation)
  async post (req: ServiceRequest<CreatePrototypeLinkData>, res: ServiceResponse){
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const formattedErrors = formatValidationErrors(errors)
      return response(req, res, 'simplified-account/services/test-with-your-users/create', {
        errors: {
          summary: formattedErrors.errorSummary,
          formErrors: formattedErrors.formErrors
        },
        prototypeLinkData: {
          description: req.body.description,
          paymentAmount: req.body.paymentAmount,
          confirmationPage: req.body.confirmationPage
        },
        backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.index, req.service.externalId, req.account.type)
      })
    }

    const parsedAmount = safeConvertPoundsStringToPence(req.body.paymentAmount)!

    const token = await createToken (new CreateTokenRequest()
      .withGatewayAccountId(req.account.id)
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
        .withType(PROTOTYPE)
        .withGatewayAccountId(req.account.id)
        .withApiToken(token)
    )

    lodash.set(req, SESSION_KEY, prototypeLink.links.pay.href)
    console.log(ConfirmModule.path)

    return res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.confirm, req.service.externalId, req.account.type))
  }
}
