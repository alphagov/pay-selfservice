import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { body, validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import { NextFunction } from 'express'
import { PublicAuthClient } from '@services/clients/pay/PublicAuthClient.class'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'

interface CreatePaymentLinkReferenceBody {
  reference?: string
  referenceLabel?: string
  referenceHint?: string
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
    }
  }
}

const validations = [
  body('reference')
    .notEmpty()
    .withMessage('Select whether your users already have a payment reference'),

  body('referenceLabel')
    .if(body('reference').equals('yes'))
    .trim()
    .notEmpty()
    .withMessage('Enter a name for the payment reference')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Payment reference name must be 255 characters or fewer'),

  body('referenceHint')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Reference hint must be 255 characters or fewer'),
]

function get(req: ServiceRequest, res: ServiceResponse) {
  const service = req.service
  const { account } = req

  const backLinkUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.create,
    service.externalId,
    account.type
  )

  const session = req.session as unknown as SessionWithPageData
  const isWelsh = session.pageData?.createPaymentLink?.isWelsh ?? false

  return response(req, res, 'simplified-account/services/payment-links/create/reference', {
    service,
    account,
    backLink: backLinkUrl,
    formValues: {},
    isWelsh,
    serviceMode: account.type
  })
}

async function post(req: ServiceRequest<CreatePaymentLinkReferenceBody>, res: ServiceResponse, next: NextFunction) {
  const service = req.service
  const { account } = req
  const body: CreatePaymentLinkReferenceBody = req.body

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLinkUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.create,
      service.externalId,
      account.type
    )

    const session = req.session as unknown as SessionWithPageData
    const isWelsh = session.pageData?.createPaymentLink?.isWelsh ?? false

    return response(req, res, 'simplified-account/services/payment-links/create/reference', {
      service,
      account,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: backLinkUrl,
      formValues: body,
      isWelsh,
      serviceMode: account.type
    })
  }

  try {
    const session = req.session as unknown as SessionWithPageData

    if (!session.pageData?.createPaymentLink) {
      const redirectUrl = formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.create,
        service.externalId,
        account.type
      )
      return res.redirect(redirectUrl)
    }

    const publicAuthClient = new PublicAuthClient()

    const createTokenRequest = new CreateTokenRequest()
      .withGatewayAccountId(account.id)
      .withServiceExternalId(service.externalId)
      .withServiceMode(account.type)
      .withDescription(`Token for "${session.pageData.createPaymentLink.paymentLinkTitle ?? ''}" payment link`)
      .withCreatedBy((req.user as { email: string }).email)
      .withTokenUsageType('PRODUCTS')

    const createTokenResponse: CreateTokenResponse = await publicAuthClient.tokens.create(createTokenRequest)

    Object.assign(session.pageData.createPaymentLink, {
      payApiToken: createTokenResponse.token,
      gatewayAccountId: account.id,
      paymentLinkAmount: 1500,
    })

    if (body.reference === 'yes') {
      session.pageData.createPaymentLink.paymentReferenceType = 'custom'
      session.pageData.createPaymentLink.paymentReferenceLabel = body.referenceLabel ?? ''
      session.pageData.createPaymentLink.paymentReferenceHint = body.referenceHint ?? ''
    } else {
      delete session.pageData.createPaymentLink.paymentReferenceType
      delete session.pageData.createPaymentLink.paymentReferenceLabel
      delete session.pageData.createPaymentLink.paymentReferenceHint
    }

    const redirectUrl = formatAccountPathsFor(paths.account.paymentLinks.review, account.externalId) as string
    return res.redirect(redirectUrl)
  } catch (error) {
    next(error)
  }
}

export { get, post }
