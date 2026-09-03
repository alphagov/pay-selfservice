import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ResponsiblePersonSession } from './constants'

function get(req: ServiceRequest, res: ServiceResponse) {
  const currentSession = ResponsiblePersonSession.extract(req)
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId

  const name = {
    firstName: currentSession.firstName ?? '',
    lastName: currentSession.lastName ?? '',
  }

  const dob = {
    dobDay: currentSession.dobDay ?? '',
    dobMonth: currentSession.dobMonth ?? '',
    dobYear: currentSession.dobYear ?? '',
  }

  const switchToAdyenLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
    req.service.externalId,
    req.account.type
  )

  const reviewLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.checkYourAnswers,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const backLink =
    req.query[FROM_REVIEW_QUERY_PARAM] === 'true'
      ? reviewLink
      : switchToAdyenLink

  return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/index', {
    backLink,
    name,
    dob
  })
}

function post(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ResponsiblePersonSession.extract(req)

  ResponsiblePersonSession.set(req, currentSession, {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dobDay: req.body.dobDay,
    dobMonth: req.body.dobMonth,
    dobYear: req.body.dobYear,
  } as ResponsiblePersonSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.address,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
