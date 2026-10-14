import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, AdyenStatementDescriptorsSession } from './constants'

function get(req: ServiceRequest, res: ServiceResponse) {
  const switchingCredentialId = req.account.getSwitchingCredential().externalId
  const currentSession = AdyenStatementDescriptorsSession.extract(req)

  if (currentSession.userDescriptor === undefined || currentSession.payoutDescriptor === undefined) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  const fromReviewQueryString = FROM_REVIEW_QUERY_PARAM + '=true'

  const userDescriptorLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.user + '?' + fromReviewQueryString,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const payoutDescriptorLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.payout + '?' + fromReviewQueryString,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const backLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.payout,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const formActionPath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.checkYourAnswers,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  return response(req, res, 'simplified-account/settings/adyen-details/statement-descriptors/check-your-answers', {
    backLink,
    formActionPath,
    userDescriptorLink,
    payoutDescriptorLink,
    currentSession,
  })
}

function post(req: ServiceRequest, res: ServiceResponse) {
  AdyenStatementDescriptorsSession.clear(req)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
