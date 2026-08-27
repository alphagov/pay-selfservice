import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

function get(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId

  const detailsLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.index,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const addressLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.address,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const contactDetailsLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.contactDetails,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/check-your-answers', {
    hasAddressLine2: true,
    detailsLink,
    contactDetailsLink,
    addressLink,
    backLink: contactDetailsLink,
  })
}

function post(req: ServiceRequest, res: ServiceResponse) {
  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
