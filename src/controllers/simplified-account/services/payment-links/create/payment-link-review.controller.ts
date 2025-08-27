import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import paths from '@root/paths'
import { CREATE_SESSION_KEY, FROM_REVIEW_QUERY_PARAM, PaymentLinkCreationSession } from './constants'
const PRODUCTS_FRIENDLY_BASE_URI = process.env.PRODUCTS_FRIENDLY_BASE_URI!
import lodash from 'lodash'
import { createProduct } from '@services/products.service'
import { CreateProductRequest } from '@models/products/CreateProductRequest.class'
import { createPaymentLinkToken } from '@services/tokens.service'
import ProductType from "@models/products/product-type";
import formatServicePathsFor from '@utils/format-service-paths-for'

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
    ...(currentSession.metadata && {
        metadata: Object.entries(currentSession.metadata).reduce(
          (acc, [key, value]) => {
            acc[key] = {
              value,
              link: formatServiceAndAccountPathsFor(
                paths.simplifiedAccount.paymentLinks.metadata.update,
                req.service.externalId,
                req.account.type,
                key
              ),
            }
            return acc
          },
          {} as Record<string, Record<string, string>>
        ),
      }),
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
    addReportingColumnLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.metadata.add + '?' + fromReviewQueryString,
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

async function post(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req
  const indexPath = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )

  const pageData = lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
  if (lodash.isEmpty(pageData)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }

  const token = await createPaymentLinkToken(req.account.id, req.service.externalId, req.account.type, req.user.email)

  const createProductRequest = new CreateProductRequest()
    .withApiToken(token)
    .withGatewayAccountId(account.id)
    .withServiceNamePath(pageData.serviceNamePath)
    .withProductNamePath(pageData.productNamePath)
    .withName(pageData.paymentLinkTitle)
    .withDescription(pageData.paymentLinkDescription ?? '')
    .withPrice(pageData.paymentLinkAmount)
    .withLanguage(pageData.language)
    .withMetadata(pageData.metadata)
    .withType(ProductType.ADHOC)

  const paymentLink = await createProduct(createProductRequest)
  const successBannerBody = account.type === GatewayAccountType.TEST ?
    `You can <a href="${paymentLink.links.pay.href}/"
        class="govuk-link govuk-link--no-visited-state" target="_blank">test your payment link</a>.`
      : ''
  req.flash('messages', {
    state: 'success',
    icon: '&check;',
    heading: `${paymentLink.name} has been created`,
    body: successBannerBody
  })
  lodash.unset(req, CREATE_SESSION_KEY)
  return res.redirect(indexPath)
}

export { get, post }

