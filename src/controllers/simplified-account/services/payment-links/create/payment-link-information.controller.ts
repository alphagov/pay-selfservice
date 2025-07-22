import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { body, validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { NextFunction } from 'express'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import { PublicAuthClient } from '@services/clients/pay/PublicAuthClient.class'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'
import Service from '@models/service/Service.class'

// @ts-expect-error: Missing type definitions for @govuk-pay/pay-js-commons module
import payJsCommons from '@govuk-pay/pay-js-commons'

const { slugify, removeIndefiniteArticles } = (payJsCommons as unknown as {
  nunjucksFilters: {
    slugify: (input: string) => string
    removeIndefiniteArticles: (input: string) => string
  }
}).nunjucksFilters

const getLanguageFromQuery = (req: ServiceRequest): string => {
  const queryLanguage = req.query?.language
  return typeof queryLanguage === 'string' ? queryLanguage : ''
}

const getServiceName = (service: Service): string => {
  return service.name
}

interface CreatePaymentLinkBody {
  name?: string
  description?: string
}

interface CreateTokenResponse {
  token: string
}

interface SessionWithPageData {
  pageData?: {
    createPaymentLink?: {
      paymentLinkTitle?: string
      paymentLinkDescription?: string
      serviceNamePath?: string
      productNamePath?: string
      isWelsh?: boolean
      payApiToken?: string
      gatewayAccountId?: number
      paymentLinkAmount?: number
      paymentReferenceType?: string
      paymentReferenceLabel?: string
      paymentReferenceHint?: string
      amountHint?: string
    }
  }
}

const supportedLanguage = {
  ENGLISH: 'en',
  WELSH: 'cy',
} as const

type SupportedLanguage = typeof supportedLanguage[keyof typeof supportedLanguage]

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
]

const makeNiceURL = (string: string): string => {
  return slugify(removeIndefiniteArticles(string))
}

const publicAuthClient = new PublicAuthClient()

function get(req: ServiceRequest, res: ServiceResponse) {
  const service = req.service
  const { account } = req

  const backLinkUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.index,
    service.externalId,
    account.type
  )

  const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI
  const languageValue: string = getLanguageFromQuery(req)
  const isWelsh: boolean = languageValue === supportedLanguage.WELSH
  const language: SupportedLanguage = isWelsh ? supportedLanguage.WELSH : supportedLanguage.ENGLISH

  const serviceName: string = (language === 'cy' && service.serviceName.cy)
    ? String(service.serviceName.cy)
    : String(service.serviceName.en)

  return response(req, res, 'simplified-account/services/payment-links/create/index', {
    service,
    account,
    backLink: backLinkUrl,
    formValues: {},
    friendlyURL,
    serviceName,
  })
}

async function post(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const service = req.service
  const { account } = req
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

    const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI
    const languageValue: string = getLanguageFromQuery(req)
    const isWelsh: boolean = languageValue === supportedLanguage.WELSH
    const language: SupportedLanguage = isWelsh ? supportedLanguage.WELSH : supportedLanguage.ENGLISH

    const serviceName: string = (language === 'cy' && service.serviceName.cy)
      ? String(service.serviceName.cy)
      : String(service.serviceName.en)

    return response(req, res, 'simplified-account/services/payment-links/create/index', {
      service,
      account,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: backLinkUrl,
      formValues: body,
      friendlyURL,
      serviceName,
    })
  }

  try {
    const createTokenRequest = new CreateTokenRequest()
      .withGatewayAccountId(account.id)
      .withServiceExternalId(service.externalId)
      .withServiceMode(account.type)
      .withDescription(`Token for "${body.name ?? ''}" payment link`)
      .withCreatedBy((req.user as { email: string }).email)
      .withTokenUsageType('PRODUCTS')

    const createTokenResponse: CreateTokenResponse = await publicAuthClient.tokens.create(createTokenRequest)

    const serviceName: string = getServiceName(service)
    const serviceNamePath: string = makeNiceURL(serviceName)
    const productNamePath: string = makeNiceURL(String(body.name ?? ''))

    const sessionData = {
      paymentLinkTitle: body.name,
      paymentLinkDescription: body.description,
      serviceNamePath,
      productNamePath,
      isWelsh: false,
      payApiToken: createTokenResponse.token,
      gatewayAccountId: account.id,
      paymentLinkAmount: 1500,
    }

    const session = req.session as unknown as SessionWithPageData
    session.pageData ??= {}
    session.pageData.createPaymentLink = sessionData

    const redirectUrl = formatAccountPathsFor(paths.account.paymentLinks.review, account.externalId) as string
    return res.redirect(redirectUrl)
  } catch (error) {
    next(error)
  }
}

export { get, post }
