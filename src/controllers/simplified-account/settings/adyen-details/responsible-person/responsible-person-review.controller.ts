import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ResponsiblePersonSession } from './constants'

function get(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ResponsiblePersonSession.extract(req)
  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  const fromReviewQueryString = FROM_REVIEW_QUERY_PARAM + '=true'

  const detailsLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.index + '?' + fromReviewQueryString,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const addressLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.address + '?' + fromReviewQueryString,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const contactDetailsLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.contactDetails + '?' + fromReviewQueryString,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/check-your-answers', {
    hasAddressLine2: currentSession.addressLine2?.length,
    detailsLink,
    contactDetailsLink,
    addressLink,
    backLink: contactDetailsLink,
    currentSession,
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
