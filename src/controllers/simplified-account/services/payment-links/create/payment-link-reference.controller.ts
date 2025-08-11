import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import { CREATE_SESSION_KEY, PaymentLinkCreationSession } from './constants'
import lodash from 'lodash'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'

function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req
  const currentSession = lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
  if (lodash.isEmpty(currentSession)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }
  const isWelsh = currentSession.language === 'cy'

  const formValues = {
    referenceTypeGroup: currentSession.paymentReferenceType,
    ...(currentSession.paymentReferenceType === 'custom' && {
      referenceLabel: currentSession.paymentReferenceLabel,
      referenceHint: currentSession.paymentReferenceHint,
    }),
  }

  return response(req, res, 'simplified-account/services/payment-links/create/reference', {
    service,
    account,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.create,
      service.externalId,
      account.type
    ),
    formValues,
    isWelsh,
    serviceMode: account.type,
    createJourney: true
  })
}

interface CreateLinkReferenceBody {
  referenceTypeGroup: 'custom' | 'standard'
  referenceLabel: string
  referenceHint: string
}

async function post(req: ServiceRequest<CreateLinkReferenceBody>, res: ServiceResponse) {
  const { service, account } = req
  const currentSession = lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
  if (lodash.isEmpty(currentSession)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }
  const isWelsh = currentSession.language === 'cy'

  const validations = [paymentLinkSchema.reference.type.validate]

  if (req.body.referenceTypeGroup === 'custom') {
    validations.push(paymentLinkSchema.reference.label.validate, paymentLinkSchema.reference.hint.validate)
  }

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLinkUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.create,
      service.externalId,
      account.type
    )

    return response(req, res, 'simplified-account/services/payment-links/create/reference', {
      service,
      account,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: backLinkUrl,
      formValues: req.body,
      isWelsh,
      serviceMode: account.type,
      createJourney: true
    })
  }

  lodash.set(req, CREATE_SESSION_KEY, {
    ...lodash.get(req, CREATE_SESSION_KEY, {}),
    paymentReferenceType: req.body.referenceTypeGroup,
    paymentReferenceLabel: req.body.referenceTypeGroup === 'custom' ? req.body.referenceLabel : undefined,
    paymentReferenceHint: req.body.referenceTypeGroup === 'custom' ? req.body.referenceHint : undefined,
    gatewayAccountId: account.id, // todo: remove me once implemented in simplified journey
    paymentLinkAmount: 1500, // todo: remove me once implemented in simplified journey
  } as PaymentLinkCreationSession)

  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.review, account.externalId) as string)
}

export { get, post }
