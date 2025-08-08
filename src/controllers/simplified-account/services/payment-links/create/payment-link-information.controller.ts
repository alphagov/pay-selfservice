import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import Service from '@models/service/Service.class'
import { PaymentLinkCreationSession, supportedLanguage, SupportedLanguage } from '../constants'
import { validatePaymentLinkInformation } from '@utils/simplified-account/validation/payment-link-creation'

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

const getIsWelsh = (req: ServiceRequest): boolean => {
  const languageValue: string = getLanguageFromQuery(req)
  const session = req.session as unknown as PaymentLinkCreationSession
  const sessionIsWelsh = session.pageData?.createPaymentLink?.isWelsh ?? false

  return (
    languageValue === supportedLanguage.WELSH ||
    (languageValue === '' && sessionIsWelsh)
  )
}

const getServiceName = (service: Service, isWelsh: boolean): string => {
  const language: SupportedLanguage = isWelsh
    ? supportedLanguage.WELSH
    : supportedLanguage.ENGLISH
  return language === 'cy' && service.serviceName.cy
    ? String(service.serviceName.cy)
    : String(service.serviceName.en)
}

interface CreatePaymentLinkBody {
  name?: string
  description?: string
}

const validations = validatePaymentLinkInformation()

const makeNiceURL = (str: string): string => {
  return slugify(removeIndefiniteArticles(str))
}

function get(req: ServiceRequest, res: ServiceResponse) {
  const service = req.service
  const { account } = req

  const backLinkUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.index,
    service.externalId,
    account.type
  )

  const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI
  const isWelsh = getIsWelsh(req)
  const serviceName = getServiceName(service, isWelsh)
  const session = req.session as unknown as PaymentLinkCreationSession
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

async function post(req: ServiceRequest, res: ServiceResponse) {
  const service = req.service
  const { account } = req
  const body = req.body as CreatePaymentLinkBody

  for (const validation of validations) {
    await validation.run(req)
  }

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLinkUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )

    const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI
    const isWelsh = getIsWelsh(req)
    const serviceName = getServiceName(service, isWelsh)

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

  const serviceName: string = service.name
  const serviceNamePath: string = makeNiceURL(serviceName)
  const productNamePath: string = makeNiceURL(String(body.name ?? ''))
  const isWelsh = getIsWelsh(req)
  const session = req.session as unknown as PaymentLinkCreationSession

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
}

export { get, post }
