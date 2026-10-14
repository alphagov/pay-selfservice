import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { AdyenStatementDescriptorsSession, FROM_REVIEW_QUERY_PARAM, type UserDescriptorBody } from './constants'
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

  const reviewPath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.checkYourAnswers,
    req.service.externalId,
    req.account.type,
    credentialId
  )
  const currentSession = AdyenStatementDescriptorsSession.extract(req)

  const comingFromReview = req.query[FROM_REVIEW_QUERY_PARAM] === 'true' && currentSession.userDescriptor !== undefined

  const userDescriptor = currentSession.userDescriptor ?? ''

  const backLink = comingFromReview ? reviewPath : switchToAdyenPath

  const formActionPath = userDescriptorPath + (comingFromReview ? '?' + FROM_REVIEW_QUERY_PARAM + '=true' : '')

  return response(req, res, 'simplified-account/settings/adyen-details/statement-descriptors/user', {
    formActionPath,
    backLink,
    userDescriptor,
  })
}

function post(req: ServiceRequest<UserDescriptorBody>, res: ServiceResponse) {
  const credentialId = req.account.getSwitchingCredential().externalId

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

  AdyenStatementDescriptorsSession.set(req, currentSession, {
    userDescriptor: req.body.userDescriptor,
  })

  const nextPage = req.query[FROM_REVIEW_QUERY_PARAM] === 'true' ? reviewPath : payoutPath

  return res.redirect(nextPage)
}

export { get, post }
