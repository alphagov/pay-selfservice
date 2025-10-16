import paths from '@root/paths'
import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import lodash from 'lodash'
import { PaymentLinkCreationSession } from '../constants'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'

function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req
  const currentSession = PaymentLinkCreationSession.extract(req)

  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }

  const isWelsh = currentSession.language === 'cy'

  return response(req, res, 'simplified-account/services/payment-links/create/metadata', {
    service,
    account,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.review,
      req.service.externalId,
      req.account.type
    ),
    isWelsh,
    serviceMode: req.account.type,
    createJourney: true,
  })
}

interface CreateLinkMetadataBody {
  reportingColumn: string
  cellContent: string
}

async function post(req: ServiceRequest<CreateLinkMetadataBody>, res: ServiceResponse) {
  const { service, account } = req
  const currentSession = PaymentLinkCreationSession.extract(req)

  const validations = [
    paymentLinkSchema.metadata.columnHeader.add.validate(currentSession.metadata ?? {}),
    paymentLinkSchema.metadata.cellContent.validate,
  ]

  for (const validation of validations) {
    await validation.run(req)
  }

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLinkUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.review,
      service.externalId,
      account.type
    )
    return response(req, res, 'simplified-account/services/payment-links/create/metadata', {
      service,
      account,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: backLinkUrl,
      formValues: req.body,
      serviceMode: account.type,
      createJourney: true,
    })
  }

  PaymentLinkCreationSession.set(req, currentSession, {
    metadata: {
      ...currentSession.metadata,
      [req.body.reportingColumn]: req.body.cellContent,
    },
  } as PaymentLinkCreationSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.review, service.externalId, account.type)
  )
}

export { get, post }
