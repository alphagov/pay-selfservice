import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { body, validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import ProductType from '@models/products/product-type'
import supportedLanguage from '@models/constants/supported-language'
import { NextFunction } from 'express'
import ProductsClient from '@services/clients/pay/ProductsClient.class'
import { CreateProductRequest } from '@models/products/CreateProductRequest.class'
import * as publicAuthClient from '@services/clients/public-auth.client'

const productsClient = new ProductsClient()

interface CreatePaymentLinkBody {
  name?: string
  description?: string
  reference?: 'yes' | 'no'
  referenceLabel?: string
  referenceHint?: string
  amount?: string
  amountType?: 'fixed' | 'variable'
  amountHint?: string
}

interface CreateTokenResponse {
  token: string
}

interface CreateTokenPayload {
  accountId: number
  payload: {
    account_id: number
    created_by: string
    type: string
    description: string
    token_account_type: string
    service_external_id: string
    service_mode: string
  }
}

interface ProductPayload {
  service_name_path: string
  product_name_path: string
  reference_enabled: boolean
  language: string
  gateway_account_id: number
  pay_api_token: string
  name: string
  description: string
  price: number | null
  type: string
  reference_label?: string
  reference_hint?: string
  amount_hint?: string
}

interface ExtendedCreateProductRequest {
  toPayload: () => ProductPayload
}

const validations = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Enter a payment link title')
    .bail()
    .isLength({ max: 230 })
    .withMessage('Title must be 230 characters or fewer'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Details must be 255 characters or fewer'),

  body('reference')
    .optional()
    .isIn(['yes', 'no'])
    .withMessage('Select yes if you need to add a reference'),

  body('referenceLabel')
    .if(body('reference').equals('yes'))
    .trim()
    .notEmpty()
    .withMessage('Enter a name for your reference field')
    .bail()
    .isLength({ max: 50 })
    .withMessage('Reference field name must be 50 characters or fewer'),

  body('referenceHint')
    .optional({ checkFalsy: true })
    .if(body('reference').equals('yes'))
    .trim()
    .isLength({ max: 255 })
    .withMessage('Hint text must be 255 characters or fewer'),

  body('amountType')
    .notEmpty()
    .withMessage('Select if the payment amount is fixed or the user can choose')
    .bail()
    .isIn(['fixed', 'variable'])
    .withMessage('Select a valid amount type'),

  body('amount')
    .if(body('amountType').equals('fixed'))
    .trim()
    .notEmpty()
    .withMessage('Enter the payment amount')
    .bail()
    .matches(/^\d+(\.\d{0,2})?$/)
    .withMessage('Enter an amount in pounds and pence using digits and a decimal point. For example "10.50"')
    .bail()
    .custom((value) => {
      const amount = parseFloat(value as string)
      if (amount < 0.01) {
        throw new Error('Amount must be 1p or more')
      }
      if (amount > 100000) {
        throw new Error('Amount must be £100,000 or less')
      }
      return true
    }),

  body('amountHint')
    .optional({ checkFalsy: true })
    .if(body('amountType').equals('variable'))
    .trim()
    .isLength({ max: 255 })
    .withMessage('Hint text must be 255 characters or fewer'),
]

function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req

  const backLinkUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.index,
    service.externalId,
    account.type
  )

  return response(req, res, 'simplified-account/services/payment-links/create/index', {
    service,
    account,
    backLink: backLinkUrl,
    formValues: {},
  })
}

async function post(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const { service, account } = req
  const body: CreatePaymentLinkBody = req.body

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLinkUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )

    return response(req, res, 'simplified-account/services/payment-links/create/index', {
      service,
      account,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: backLinkUrl,
      formValues: body,
    })
  }

  try {
    let priceInPence: number | null = null
    if (body.amountType === 'fixed' && body.amount) {
      priceInPence = Math.round(parseFloat(body.amount) * 100)
    }

    const serviceNamePath = service.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)

    const productNamePath = (body.name ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)

    const createTokenResponse = await (publicAuthClient as { createTokenForAccount: (payload: CreateTokenPayload) => Promise<CreateTokenResponse> }).createTokenForAccount({
      accountId: account.id,
      payload: {
        account_id: account.id,
        created_by: req.user.email,
        type: 'PRODUCTS',
        description: `Token for "${body.name ?? ''}" payment link`,
        token_account_type: account.type,
        service_external_id: service.externalId,
        service_mode: account.type
      }
    })

    const createProductRequest = new CreateProductRequest()
      .withApiToken(createTokenResponse.token)
      .withGatewayAccountId(account.id)
      .withName(body.name ?? '')
      .withDescription(body.description ?? '')
      .withType(ProductType.ADHOC)

    if (priceInPence !== null) {
      createProductRequest.withPrice(priceInPence)
    }

    const payload: ProductPayload = {
      ...createProductRequest.toPayload(),
      service_name_path: serviceNamePath,
      product_name_path: productNamePath,
      reference_enabled: body.reference === 'yes',
      language: supportedLanguage.ENGLISH
    }

    if (body.amountType === 'variable') {
      payload.price = null
    }

    if (body.reference === 'yes') {
      if (body.referenceLabel) {
        payload.reference_label = body.referenceLabel
      }
      if (body.referenceHint) {
        payload.reference_hint = body.referenceHint
      }
    }

    if (body.amountType === 'variable' && body.amountHint) {
      payload.amount_hint = body.amountHint
    }

    const extendedRequest: ExtendedCreateProductRequest = {
      toPayload: () => payload
    }

    await productsClient.products.create(extendedRequest as CreateProductRequest)

    const redirectUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )

    return res.redirect(redirectUrl)
  } catch (error) {
    next(error)
  }
}

export { get, post }
