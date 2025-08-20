import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { CREATE_SESSION_KEY, FROM_REVIEW_QUERY_PARAM, PaymentLinkCreationSession } from './constants'
const PRODUCTS_FRIENDLY_BASE_URI = process.env.PRODUCTS_FRIENDLY_BASE_URI!
import lodash from 'lodash'

function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req
  const currentSession = lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)

  if (lodash.isEmpty(currentSession)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }

  const isWelsh = currentSession.language === 'cy'
  const fromReviewQueryString = FROM_REVIEW_QUERY_PARAM + '=true'

  return response(req, res, 'simplified-account/services/payment-links/create/review', {
    service,
    account,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.amount,
      service.externalId,
      account.type
    ),
    cancelLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    ),
    titleLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.create + '?' + fromReviewQueryString,
      service.externalId,
      account.type
    ),
    referenceLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.reference + '?' + fromReviewQueryString,
      service.externalId,
      account.type
    ),
    amountLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.amount + '?' + fromReviewQueryString,
      service.externalId,
      account.type
    ),
    friendlyURL: PRODUCTS_FRIENDLY_BASE_URI,
    pageData: currentSession,
    isWelsh,
    serviceMode: account.type,
    createJourney: true
  })
}

function post(req: ServiceRequest, res: ServiceResponse) {
  return res.status(501).json({
    message: 'not implemented'
  })
}

export { get, post }
