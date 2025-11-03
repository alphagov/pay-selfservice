import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, PaymentLinkCreationSession } from './constants'
import { createProduct } from '@services/products.service'
import { CreateProductRequest } from '@models/products/CreateProductRequest.class'
import { createPaymentLinkToken } from '@services/tokens.service'
import { ProductType } from '@models/products/product-type'

const PRODUCTS_FRIENDLY_BASE_URI = process.env.PRODUCTS_FRIENDLY_BASE_URI!

function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req
  const currentSession = PaymentLinkCreationSession.extract(req)

  if (currentSession.isEmpty()) {
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
    createJourney: true,
    paymentLinkTitle: currentSession.paymentLinkTitle,
  })
}

async function post(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req
  const indexPath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.index,
    service.externalId,
    account.type
  )

  const currentSession = PaymentLinkCreationSession.extract(req)
  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }

  const token = await createPaymentLinkToken(req.account.id, req.service.externalId, req.account.type, req.user.email)

  const createProductRequest = new CreateProductRequest()
    .withApiToken(token)
    .withGatewayAccountId(account.id)
    .withServiceNamePath(currentSession.serviceNamePath!)
    .withProductNamePath(currentSession.productNamePath!)
    .withName(currentSession.paymentLinkTitle!)
    .withDescription(currentSession.paymentLinkDescription ?? '')
    .withPrice(currentSession.paymentLinkAmount!)
    .withLanguage(currentSession.language!)
    .withMetadata(currentSession.metadata)
    .withType(ProductType.ADHOC)
    .withReferenceEnabled(currentSession.paymentReferenceType === 'custom')
    .withReferenceHint(currentSession.paymentReferenceHint)
    .withReferenceLabel(currentSession.paymentReferenceLabel)

  const paymentLink = await createProduct(createProductRequest)
  const successBannerBody =
    account.type === GatewayAccountType.TEST
      ? `You can <a href="${paymentLink.links.pay.href}/"
        class="govuk-link govuk-link--no-visited-state" target="_blank">test your payment link</a>.`
      : ''
  req.flash('messages', {
    state: 'success',
    icon: '&check;',
    heading: `${paymentLink.name} has been created`,
    body: successBannerBody,
  })
  PaymentLinkCreationSession.clear(req)
  return res.redirect(indexPath)
}

export { get, post }
