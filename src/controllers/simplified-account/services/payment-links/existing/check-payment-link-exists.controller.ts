import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import lodash from 'lodash'
import paths from '@root/paths'
import slugifyString from '@utils/simplified-account/format/slugify-string'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ValidationChain, validationResult } from 'express-validator'
import formatValidationErrors from '../../../../../utils/simplified-account/format/format-validation-errors'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import {
  CREATE_SESSION_KEY,
  getSession,
  PaymentLinkCreationSession,
} from '@controllers/simplified-account/services/payment-links/create/constants'
import { isWelshSelected } from '@utils/simplified-account/languageSelectionUtils'
import type Service from '@models/service/Service.class'
import type GatewayAccount from '@models/gateway-account/GatewayAccount.class'

const FRIENDLY_URL = String(process.env.PRODUCTS_FRIENDLY_BASE_URI)

function get(req: ServiceRequest, res: ServiceResponse) {
  const sessionInfo = extractSessionInfo(req, res)
  if (!sessionInfo) return
  const { service, account, session } = sessionInfo
  const isWelsh = isWelshSelected(req)

  renderPage(req, res, getRenderOptions(service, account, session, isWelsh))
}

async function post(req: ServiceRequest, res: ServiceResponse) {
  const sessionInfo = extractSessionInfo(req, res)
  if (!sessionInfo) return
  const { service, account, session } = sessionInfo
  const isWelsh = isWelshSelected(req)
  const Validation = paymentLinkSchema.existing.paymentLink.validate

  const hasErrors = await validateAndRenderErrors(
    req,
    res,
    Validation,
    getRenderOptions(service, account, session, isWelsh)
  )
  if (hasErrors) return

  lodash.set(req, CREATE_SESSION_KEY, {
    ...session,
    productNamePath: slugifyString(session.productNamePath),
    friendlyURL: FRIENDLY_URL,
    serviceNamePath: slugifyString(service.name),
  } as PaymentLinkCreationSession)

  res.redirect(
    formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.reference, service.externalId, account.type)
  )
}

// Interfaces
interface RenderOptions {
  backLink: string
  serviceMode: string
  formValues: { paymentLink: string }
  service: string
  friendlyURL: string
  productNamePath: string
  isWelsh: boolean
  errors?: object
}

// Support functions
function redirectToIndex(res: ServiceResponse, serviceId: string, accountType: string) {
  res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, serviceId, accountType))
}

function extractSessionInfo<T>(req: ServiceRequest<T>, res: ServiceResponse) {
  const service = req.service
  const account = req.account
  const session = getSession(req)
  if (lodash.isEmpty(session)) {
    redirectToIndex(res, service.externalId, account.type)
    return
  }
  return { service, account, session }
}

function getRenderOptions(
  service: Service,
  account: GatewayAccount,
  session: PaymentLinkCreationSession,
  isWelsh: boolean
) {
  const serviceName = isWelsh && service.serviceName?.cy ? service.serviceName.cy : service.name
  return {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.create,
      service.externalId,
      account.type
    ),
    serviceMode: account.type,
    formValues: { paymentLink: session.paymentLinkTitle },
    service: serviceName,
    friendlyURL: FRIENDLY_URL,
    productNamePath: session.productNamePath,
    isWelsh,
  }
}

function renderPage(req: ServiceRequest, res: ServiceResponse, renderOptions: RenderOptions) {
  response(req, res, 'simplified-account/services/payment-links/create/check-payment-link', renderOptions)
}

async function validateAndRenderErrors(
  req: ServiceRequest,
  res: ServiceResponse,
  validate: ValidationChain,
  renderOptions: RenderOptions
): Promise<boolean> {
  await validate.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formatted = formatValidationErrors(errors)
    renderPage(req, res, {
      ...renderOptions,
      errors: {
        summary: formatted.errorSummary,
        formErrors: formatted.formErrors,
      },
      formValues: req.body,
    })
    return true
  }
  return false
}

export { get, post }
