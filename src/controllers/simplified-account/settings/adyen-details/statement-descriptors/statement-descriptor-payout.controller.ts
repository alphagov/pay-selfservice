import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'

import { AdyenStatementDescriptorsSession, FROM_REVIEW_QUERY_PARAM, type PayoutDescriptorBody } from './constants'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'

function get(req: ServiceRequest, res: ServiceResponse) {
  const credentialId = req.account.getSwitchingCredential().externalId

  const switchToAdyenPath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
    req.service.externalId,
    req.account.type
  )

  const userDescriptorPath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.user,
    req.service.externalId,
    req.account.type,
    credentialId
  )

  const payoutPath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.payout,
    req.service.externalId,
    req.account.type,
    credentialId
  )

  const reviewPath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.checkYourAnswers,
    req.service.externalId,
    req.account.type,
    credentialId
  )

  const currentSession = AdyenStatementDescriptorsSession.extract(req)

  if (currentSession.isEmpty()) {
    return res.redirect(switchToAdyenPath)
  }

  const payoutDescriptor = currentSession.payoutDescriptor ?? ''

  const comingFromReview =
    req.query[FROM_REVIEW_QUERY_PARAM] === 'true' && currentSession.payoutDescriptor !== undefined

  const backLink = comingFromReview ? reviewPath : userDescriptorPath
  const formActionPath = payoutPath

  return response(req, res, 'simplified-account/settings/adyen-details/statement-descriptors/payout', {
    backLink,
    formActionPath,
    payoutDescriptor,
  })
}

function post(req: ServiceRequest<PayoutDescriptorBody>, res: ServiceResponse) {
  const credentialId = req.account.getSwitchingCredential().externalId

  const reviewPath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.checkYourAnswers,
    req.service.externalId,
    req.account.type,
    credentialId
  )

  const currentSession = AdyenStatementDescriptorsSession.extract(req)

  AdyenStatementDescriptorsSession.set(req, currentSession, {
    payoutDescriptor: req.body.payoutDescriptor,
  })

  return res.redirect(reviewPath)
}

export { get, post }
