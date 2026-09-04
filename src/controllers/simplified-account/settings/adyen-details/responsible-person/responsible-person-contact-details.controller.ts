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

  const contact = {
    telephoneNumber: currentSession.telephoneNumber ?? '',
    email: currentSession.email ?? '',
  }

  const addressLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.address,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const reviewLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.checkYourAnswers,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const backLink = req.query[FROM_REVIEW_QUERY_PARAM] === 'true' ? reviewLink : addressLink

  return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/contact-details', {
    backLink,
    contact,
  })
}

interface ResponsiblePersonContactDetailsBody {
  telephoneNumber: string
  email: string
}

function post(req: ServiceRequest<ResponsiblePersonContactDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ResponsiblePersonSession.extract(req)

  ResponsiblePersonSession.set(req, currentSession, {
    telephoneNumber: req.body.telephoneNumber,
    email: req.body.email,
  } as ResponsiblePersonSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.checkYourAnswers,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
