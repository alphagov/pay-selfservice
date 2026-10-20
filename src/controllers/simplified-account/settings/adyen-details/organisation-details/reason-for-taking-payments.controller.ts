import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { markTaskAsComplete } from '@services/adyen-setup.service'
import { adyenDetailsSchema } from '@utils/simplified-account/validation/adyen-details.schema'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'
import { OrganisationDetailsSession, TakingPaymentsFor } from './constants'
import { createOrganisation } from '@services/adyen-details.service'

function getBackLink(req: ServiceRequest) {
  return formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistration,
    req.service.externalId,
    req.account.type,
    req.account.getSwitchingCredential().externalId
  )
}

function get(req: ServiceRequest, res: ServiceResponse) {
  const currentSession = OrganisationDetailsSession.extract(req)

  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  return response(req, res, 'simplified-account/settings/adyen-details/reason-for-taking-payments', {
    backLink: getBackLink(req),
  })
}

async function post(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)

  const validations = [adyenDetailsSchema.selectTakingPaymentsFor.validate]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/reason-for-taking-payments', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: getBackLink(req),
    })
  }

  const completeSession = new OrganisationDetailsSession({
    ...currentSession,
  } as OrganisationDetailsSession)

  const takingPaymentsFor = (req.body as { takingPaymentsFor: TakingPaymentsFor }).takingPaymentsFor

  await createOrganisation(
    completeSession,
    takingPaymentsFor,
    req.service.name,
    req.service.externalId,
    req.account.type,
    switchingCredentialId,
    req.user.externalId
  )
  await markTaskAsComplete(req.service.externalId, req.account.type, switchingCredentialId, 'organisationDetails')
  OrganisationDetailsSession.clear(req)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
