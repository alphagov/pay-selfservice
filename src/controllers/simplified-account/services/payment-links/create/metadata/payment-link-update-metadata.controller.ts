import paths from '@root/paths'
import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import lodash from 'lodash'
import { CREATE_SESSION_KEY, PaymentLinkCreationSession } from '../constants'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { NotFoundError } from '@root/errors'
import { NextFunction } from 'express'

function getSession<T>(req: ServiceRequest<T>) {
  return lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
}

function get(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const { service, account } = req
  const currentSession = getSession(req)

  if (lodash.isEmpty(currentSession)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }

  const isWelsh = currentSession.language === 'cy'

  const formValues = {
    reportingColumn: req.params.metadataKey,
    cellContent: currentSession.metadata?.[req.params.metadataKey],
  }

  try {
    checkKeyExistsOnSessionMetadata(currentSession, req)
    return response(req, res, 'simplified-account/services/payment-links/create/metadata', {
      service,
      account,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.review,
        req.service.externalId,
        req.account.type
      ),
      formValues,
      serviceMode: req.account.type,
      isWelsh,
    })
  } catch (error) {
    next(error)
  }
}

interface UpdateLinkMetadataBody {
  action: 'edit' | 'delete'
  reportingColumn: string
  cellContent: string
}

async function post(req: ServiceRequest<UpdateLinkMetadataBody>, res: ServiceResponse) {
  const { service, account } = req
  const currentSession = getSession(req)

  if (lodash.isEmpty(currentSession)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }

  const isWelsh = currentSession.language === 'cy'

  if (req.body.action === 'edit') {
    const validations = [
      paymentLinkSchema.metadata.columnHeader.edit.validate(currentSession.metadata ?? {}, req.params.metadataKey),
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
        isWelsh,
        serviceMode: account.type,
        createJourney: true,
      })
    }

    lodash.set(req, CREATE_SESSION_KEY, {
      ...lodash.get(req, CREATE_SESSION_KEY, {}),
      metadata: {
        ...lodash.omit(currentSession.metadata, req.params.metadataKey),
        [req.body.reportingColumn]: req.body.cellContent,
      },
    } as PaymentLinkCreationSession)
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.review, service.externalId, account.type)
    )
  } else if (req.body.action === 'delete') {
    const updatedMetadata = lodash.omit(currentSession.metadata, req.params.metadataKey)

    if (lodash.isEmpty(updatedMetadata)) {
      lodash.unset(currentSession, 'metadata')
    } else {
      currentSession.metadata = updatedMetadata
    }

    lodash.set(req, CREATE_SESSION_KEY, currentSession)
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.review, service.externalId, account.type)
    )
  }
}

function checkKeyExistsOnSessionMetadata(
  session: PaymentLinkCreationSession,
  req: ServiceRequest
): asserts session is PaymentLinkCreationSession & {
  metadata: NonNullable<Record<string, string>>
} {
  if (!Object.keys(session.metadata ?? {}).includes(req.params.metadataKey)) {
    throw new NotFoundError(`Metadata key was not found on product`)
  }
}

export { get, post }
