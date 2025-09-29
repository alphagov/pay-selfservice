import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { PaymentLinkCreationSession, CREATE_SESSION_KEY, FROM_REVIEW_QUERY_PARAM } from './constants'
import lodash from 'lodash'
import slugifyString from '@utils/simplified-account/format/slugify-string'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { getProductByServiceAndProductPath } from '@services/products.service'
import { isWelshSelected } from '@utils/simplified-account/is-welsh'

const PRODUCTS_FRIENDLY_BASE_URI = process.env.PRODUCTS_FRIENDLY_BASE_URI!

function get(req: ServiceRequest, res: ServiceResponse) {
  const { account, service } = req
  const currentSession = lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
  const isWelsh = isWelshSelected(req)
  const isUsingEnglishServiceName =
    currentSession.useEnglishServiceName ?? (req.query.useEnglishServiceName as string) === 'true'

  // handle case where welsh payment link is selected but no welsh service name is set
  if (isWelsh && !service.serviceName.cy && !isUsingEnglishServiceName && account.type !== GatewayAccountType.TEST) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.addWelshServiceName,
        req.service.externalId,
        req.account.type
      )
    )
  }
  const serviceName = isWelsh ? (service.serviceName.cy ?? service.name) : service.name

  const formValues = {
    name: currentSession.paymentLinkTitle ?? '',
    description: currentSession.paymentLinkDescription ?? '',
  }

  return response(req, res, 'simplified-account/services/payment-links/create/index', {
    service,
    account,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    ),
    formValues,
    friendlyURL: PRODUCTS_FRIENDLY_BASE_URI,
    serviceName,
    isWelsh,
    isUsingEnglishServiceName,
    serviceMode: account.type,
    createJourney: true,
  })
}

interface CreateLinkInformationBody {
  name: string
  description?: string
}

async function post(req: ServiceRequest<CreateLinkInformationBody>, res: ServiceResponse) {
  const { account, service } = req
  const currentSession = lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
  const isWelsh = currentSession.language === 'cy' || (req.query.language as string) === 'cy'
  const isUsingEnglishServiceName =
    currentSession.useEnglishServiceName ?? (req.query.useEnglishServiceName as string) === 'true'
  const serviceName = isWelsh ? (service.serviceName.cy ?? service.name) : service.name

  const validations = [paymentLinkSchema.info.name.validate, paymentLinkSchema.info.description.validate]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/services/payment-links/create/index', {
      service,
      account,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.index,
        service.externalId,
        account.type
      ),
      formValues: req.body,
      friendlyURL: PRODUCTS_FRIENDLY_BASE_URI,
      serviceName,
      isWelsh,
      isUsingEnglishServiceName,
      serviceMode: account.type,
      createJourney: true,
    })
  }

  lodash.set(req, CREATE_SESSION_KEY, {
    ...currentSession,
    paymentLinkTitle: req.body.name,
    paymentLinkDescription: req.body.description,
    language: isWelsh ? 'cy' : 'en',
    useEnglishServiceName: isUsingEnglishServiceName,
    serviceNamePath: slugifyString(serviceName),
    productNamePath: slugifyString(req.body.name),
  } as PaymentLinkCreationSession)

  let redirectPath
  try {
    // if Payment Link exists redirect to existingPaymentLink page
    await getProductByServiceAndProductPath(slugifyString(serviceName), slugifyString(req.body.name))
    redirectPath = paths.simplifiedAccount.paymentLinks.existingPaymentLink
  } catch {
    // if Payment Link unique redirect to review if fromReview else reference page
    redirectPath =
      (req.query[FROM_REVIEW_QUERY_PARAM] as string) === 'true'
        ? paths.simplifiedAccount.paymentLinks.review
        : paths.simplifiedAccount.paymentLinks.reference
  }

  return res.redirect(formatServiceAndAccountPathsFor(redirectPath, service.externalId, account.type))
}

export { get, post }
