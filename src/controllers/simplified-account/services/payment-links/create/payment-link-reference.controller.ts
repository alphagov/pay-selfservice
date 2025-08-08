import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import { PaymentLinkCreationSession } from '../constants'
import { validatePaymentLinkReferenceDetails } from '@utils/simplified-account/validation/payment-link-creation'

interface CreatePaymentLinkReferenceBody {
  reference?: string
  referenceLabel?: string
  referenceHint?: string
}

const validations = validatePaymentLinkReferenceDetails()

function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req

  const backLinkUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.create,
    service.externalId,
    account.type
  )

  const session = req.session as unknown as PaymentLinkCreationSession
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

async function post(req: ServiceRequest<CreatePaymentLinkReferenceBody>, res: ServiceResponse) {
  const { service, account } = req
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

    const session = req.session as unknown as PaymentLinkCreationSession
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

  const session = req.session as unknown as PaymentLinkCreationSession

  if (!session.pageData?.createPaymentLink) {
    const redirectUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.create,
      service.externalId,
      account.type
    )
    return res.redirect(redirectUrl)
  }

  Object.assign(session.pageData.createPaymentLink, {
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

  const redirectUrl = formatAccountPathsFor(
    paths.account.paymentLinks.review,
    account.externalId
  ) as string

  return res.redirect(redirectUrl)
}

export { get, post }
