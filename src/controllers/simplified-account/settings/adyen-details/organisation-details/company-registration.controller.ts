import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { CompanyRegistrationBody, OrganisationDetailsSession } from './constants'

export function get(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
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

  return response(req, res, 'simplified-account/settings/adyen-details/company-registration-number', {
    companyRegistrationNumber: currentSession.companyRegistrationNumber ?? '',
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    ),
  })
}

export function post(req: ServiceRequest<CompanyRegistrationBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)

  OrganisationDetailsSession.set(req, currentSession, {
    companyRegistrationNumber: req.body.companyRegistrationNumber,
  } as OrganisationDetailsSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistration,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}
