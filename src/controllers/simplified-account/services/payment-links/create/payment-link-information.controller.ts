import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { body, validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { NextFunction } from 'express'
import Service from '@models/service/Service.class'

// @ts-expect-error: Missing type definitions for @govuk-pay/pay-js-commons module
import payJsCommons from '@govuk-pay/pay-js-commons'

const typedFormatServiceAndAccountPathsFor = formatServiceAndAccountPathsFor as (path: string, externalId: string, accountType: string) => string

const { slugify, removeIndefiniteArticles } = (payJsCommons as unknown as {
  nunjucksFilters: {
    slugify: (input: string) => string
    removeIndefiniteArticles: (input: string) => string
  }
}).nunjucksFilters

const getLanguageFromQuery = <T>(req: ServiceRequest<T>): string => {
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

interface SessionWithPageData {
  pageData?: {
    createPaymentLink?: {
      paymentLinkTitle?: string
      paymentLinkDescription?: string
      serviceNamePath?: string
      productNamePath?: string
      isWelsh?: boolean
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

function get(req: ServiceRequest, res: ServiceResponse) {
  const service = req.service
  const { account } = req

  const backLinkUrl = typedFormatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.index,
    service.externalId,
    account.type
  )

  const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI
  const languageValue: string = getLanguageFromQuery(req)
  const session = req.session as unknown as SessionWithPageData
  const sessionIsWelsh = session.pageData?.createPaymentLink?.isWelsh ?? false

  const isWelsh: boolean = languageValue === supportedLanguage.WELSH ||
    (languageValue === '' && sessionIsWelsh)
  const language: SupportedLanguage = isWelsh ? supportedLanguage.WELSH : supportedLanguage.ENGLISH

  const serviceName: string = (language === 'cy' && service.serviceName.cy)
    ? String(service.serviceName.cy)
    : String(service.serviceName.en)

  const sessionData = session.pageData?.createPaymentLink

  const formValues = {
    name: sessionData?.paymentLinkTitle ?? '',
    description: sessionData?.paymentLinkDescription ?? '',
  }

  return response(req, res, 'simplified-account/services/payment-links/create/index', {
    service,
    account,
    backLink: backLinkUrl,
    formValues,
    friendlyURL,
    serviceName,
    isWelsh,
    serviceMode: account.type
  })
}

async function post(req: ServiceRequest<CreatePaymentLinkBody>, res: ServiceResponse, next: NextFunction) {
  const service = req.service
  const { account } = req
  const body: CreatePaymentLinkBody = req.body

  for (const validation of validations) {
    await validation.run(req)
  }
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLinkUrl = typedFormatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )

    const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI
    const languageValue: string = getLanguageFromQuery(req)
    const session = req.session as unknown as SessionWithPageData
    const sessionIsWelsh = session.pageData?.createPaymentLink?.isWelsh ?? false

    const isWelsh: boolean = languageValue === supportedLanguage.WELSH ||
      (languageValue === '' && sessionIsWelsh)
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
      formValues: req.body,
      friendlyURL,
      serviceName,
      isWelsh,
      serviceMode: account.type
    })
  }

  try {
    const serviceName: string = getServiceName(service)
    const serviceNamePath: string = makeNiceURL(serviceName)
    const productNamePath: string = makeNiceURL(String(body.name ?? ''))
    const languageValue: string = getLanguageFromQuery(req)
    const session = req.session as unknown as SessionWithPageData
    const sessionIsWelsh = session.pageData?.createPaymentLink?.isWelsh ?? false

    const isWelsh: boolean = languageValue === supportedLanguage.WELSH ||
      (languageValue === '' && sessionIsWelsh)

    const sessionData = {
      paymentLinkTitle: body.name,
      paymentLinkDescription: body.description,
      serviceNamePath,
      productNamePath,
      isWelsh,
    }

    session.pageData ??= {}
    session.pageData.createPaymentLink = sessionData

    const redirectUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.reference,
      service.externalId,
      account.type
    )

    return res.redirect(redirectUrl)
  } catch (error) {
    next(error)
  }
}

export { get, post }
