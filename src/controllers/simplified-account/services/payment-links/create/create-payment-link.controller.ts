import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { body, validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { NextFunction } from 'express'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import * as publicAuthClient from '@services/clients/public-auth.client'
import * as lodash from 'lodash'

import { nunjucksFilters } from '@govuk-pay/pay-js-commons'

const safeSlugify = (input: string): string => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const result = nunjucksFilters.slugify(input)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return String(result || '')
}

const safeRemoveIndefiniteArticles = (input: string): string => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const result = nunjucksFilters.removeIndefiniteArticles(input)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return String(result || input)
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

const makeNiceURL = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return ''
  }

  const input = str.trim()
  if (!input) {
    return ''
  }

  const withoutArticles = safeRemoveIndefiniteArticles(input)
  const result = safeSlugify(withoutArticles)

  return typeof result === 'string' ? result : ''
}

function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req

  const backLinkUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.index,
    service.externalId,
    account.type
  )

  const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI
  const isWelsh = lodash.get(req, 'query.language') === supportedLanguage.WELSH
  const language: SupportedLanguage = isWelsh ? supportedLanguage.WELSH : supportedLanguage.ENGLISH

  const serviceName = (language === 'cy' && req.service.serviceName.cy)
    ? req.service.serviceName.cy
    : req.service.serviceName.en

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

    const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI
    const isWelsh = lodash.get(req, 'query.language') === supportedLanguage.WELSH
    const language: SupportedLanguage = isWelsh ? supportedLanguage.WELSH : supportedLanguage.ENGLISH

    const serviceName = (language === 'cy' && req.service.serviceName.cy)
      ? req.service.serviceName.cy
      : req.service.serviceName.en

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
    let safeName = ''
    let safeServiceName = ''

    if (body.name && typeof body.name === 'string') {
      safeName = body.name
    }

    if (service.name && typeof service.name === 'string') {
      safeServiceName = service.name
    }

    console.log('About to call createTokenForAccount with:', {
      accountId: account.id,
      hasCreateTokenForAccount: typeof publicAuthClient.createTokenForAccount
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const createTokenResponse = await publicAuthClient.createTokenForAccount({
      accountId: account.id,
      payload: {
        account_id: account.id,
        created_by: req.user.email,
        type: 'PRODUCTS',
        description: `Token for "${safeName}" payment link`,
        token_account_type: account.type,
        service_external_id: service.externalId,
        service_mode: account.type,
      },
    })

    console.log('createTokenForAccount response:', createTokenResponse)

    const serviceNamePath = makeNiceURL(safeServiceName)
    const productNamePath = makeNiceURL(safeName)

    const sessionData = {
      paymentLinkTitle: body.name,
      paymentLinkDescription: body.description,
      serviceNamePath,
      productNamePath,
      isWelsh: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      payApiToken: createTokenResponse.token,
      gatewayAccountId: account.id,
      paymentLinkAmount: 1500,
    }

    const session = req.session as SessionWithPageData
    session.pageData ??= {}
    session.pageData.createPaymentLink = sessionData

    const redirectUrl = formatAccountPathsFor(paths.account.paymentLinks.review, account.externalId)
    return res.redirect(redirectUrl)
  } catch (error) {
    next(error)
  }
}

export { get, post }
