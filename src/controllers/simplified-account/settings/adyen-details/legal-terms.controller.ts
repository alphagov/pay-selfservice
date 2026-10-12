import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { markTaskAsComplete } from '@services/adyen-setup.service'
import { adyenDetailsSchema } from '@utils/simplified-account/validation/adyen-details.schema'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'
import formatPathFor from '@utils/replace-params-in-path'

function getBackLink(req: ServiceRequest) {
  return formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
    req.service.externalId,
    req.account.type
  )
}

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/adyen-details/legal-terms', {
    backLink: getBackLink(req),
    govUkPayTermsLink: formatPathFor(paths.policyPage, 'agreement-for-crown-and-non-crown-bodies'),
    adyenAgreementLink: formatPathFor(paths.policyPage, 'agreement-schedule-7-adyen'),
  })
}

async function post(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req

  const validations = [adyenDetailsSchema.acceptTerms.validate]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    const summary = formattedErrors.errorSummary.map((error) => ({
      ...error,
      text: 'Confirm that you have the legal authority to accept these terms',
    }))

    return response(req, res, 'simplified-account/settings/adyen-details/legal-terms', {
      errors: {
        summary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: getBackLink(req),
    })
  }

  const switchingCredentialId = account.getSwitchingCredential().externalId

  await markTaskAsComplete(req.service.externalId, req.account.type, switchingCredentialId, 'legalTerms')

  return res.redirect(getBackLink(req))
}

export { get, post }
