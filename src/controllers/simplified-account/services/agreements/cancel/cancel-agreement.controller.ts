import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { validateYesNoAnswer } from '@utils/simplified-account/validation/yes-no-answer.schema'
import { getAgreement, cancelAgreement } from '@services/agreements.service'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const agreement = await getAgreement(req.params.agreementExternalId, req.service.externalId)
  return response(req, res, 'simplified-account/services/agreements/cancel', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.agreements.detail,
      req.service.externalId,
      req.account.type,
      agreement.externalId
    ),
    agreement,
  })
}

interface CancelAgreementBody {
  cancelAgreement: string
}

async function post(req: ServiceRequest<CancelAgreementBody>, res: ServiceResponse) {
  const agreement = await getAgreement(req.params.agreementExternalId, req.service.externalId)
  const validations = [validateYesNoAnswer('cancelAgreement')]
  await Promise.all(validations.map((validation) => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedErrors = formatValidationErrors(validationErrors)
    return response(req, res, 'simplified-account/services/agreements/cancel', {
      errors: {
        formErrors: formattedErrors.formErrors,
        summary: formattedErrors.errorSummary,
      },
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.agreements.detail,
        req.service.externalId,
        req.account.type,
        agreement.externalId
      ),
      agreement,
    })
  }

  if (req.body.cancelAgreement.toLowerCase() === 'yes') {
    await cancelAgreement(req.service.externalId, req.account.type, agreement.externalId, req.user)
  }

  res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.agreements.detail,
      req.service.externalId,
      req.account.type,
      agreement.externalId
    )
  )
}

export { get, post }
