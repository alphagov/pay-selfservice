import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import { PaymentLinkCreationSession } from '@controllers/simplified-account/services/payment-links/create/constants'
import { slugifyString } from '@utils/simplified-account/format/slugify-string'
const FRIENDLY_URL = String(process.env.PRODUCTS_FRIENDLY_BASE_URI)

function get(req: ServiceRequest, res: ServiceResponse) {
  const currentSession = PaymentLinkCreationSession.extract(req)
  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  const isWelshPaymentLink = currentSession.language === 'cy' || (req.query.language as string) === 'cy'
  const serviceName = isWelshPaymentLink && req.service.serviceName?.cy ? req.service.serviceName.cy : req.service.name

  const context = {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.create,
      req.service.externalId,
      req.account.type
    ),
    serviceMode: req.account.type,
    formValues: { paymentLink: currentSession.paymentLinkTitle },
    service: serviceName,
    friendlyURL: FRIENDLY_URL,
    productNamePath: currentSession.productNamePath,
    isWelsh: isWelshPaymentLink,
  }

  return response(req, res, 'simplified-account/services/payment-links/create/existing-url', context)
}

interface PaymentLinkPathBody {
  paymentLinkPath: string
}

async function post(req: ServiceRequest<PaymentLinkPathBody>, res: ServiceResponse) {
  const currentSession = PaymentLinkCreationSession.extract(req)
  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  const isWelshPaymentLink = currentSession.language === 'cy' || (req.query.language as string) === 'cy'

  await paymentLinkSchema.existing.paymentLink.validate.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const context = {
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.create,
        req.service.externalId,
        req.account.type
      ),
      serviceMode: req.account.type,
      formValues: { paymentLinkPath: req.body.paymentLinkPath },
      service: isWelshPaymentLink && req.service.serviceName?.cy ? req.service.serviceName.cy : req.service.name,
      friendlyURL: FRIENDLY_URL,
      productNamePath: currentSession.productNamePath,
      isWelsh: isWelshPaymentLink,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
    }

    return response(req, res, 'simplified-account/services/payment-links/create/existing-url', context)
  }

  PaymentLinkCreationSession.set(req, currentSession, {
    productNamePath: slugifyString(req.body.paymentLinkPath),
  } as PaymentLinkCreationSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.reference,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
