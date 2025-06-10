import * as edit from './edit/edit-demo-payment-details.controller'
import * as inbound from './inbound.controller'
import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import lodash from 'lodash'
import {
  DemoPaymentSessionData,
  PAYMENT_DEFAULTS,
  SESSION_KEY,
} from '@controllers/simplified-account/services/make-a-demo-payment/constants'
import { createDemoPaymentToken } from '@services/tokens.service'
import { createDemoProduct } from '@services/products.service'

function get(req: ServiceRequest, res: ServiceResponse) {
  let demoPayment = lodash.get(req, SESSION_KEY, {} as DemoPaymentSessionData)
  if (lodash.isEmpty(demoPayment)) {
    demoPayment = PAYMENT_DEFAULTS
    lodash.set(req, SESSION_KEY, demoPayment)
  }

  return response(req, res, 'simplified-account/services/demo-payment/index', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.dashboard.index,
      req.service.externalId,
      req.account.type
    ),
    editLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.demoPayment.edit,
      req.service.externalId,
      req.account.type
    ),
    continueLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.demoPayment.mockCard,
      req.service.externalId,
      req.account.type
    ),
    demoPayment,
  })
}

function getMockCardNumber(req: ServiceRequest, res: ServiceResponse) {
  const { description, amount } = lodash.get(req, SESSION_KEY, {} as DemoPaymentSessionData)
  if (!description || !amount) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.demoPayment.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  return response(req, res, 'simplified-account/services/demo-payment/mock-card-number', {})
}

async function post(req: ServiceRequest, res: ServiceResponse) {
  const { description, amount } = lodash.get(req, SESSION_KEY, {} as DemoPaymentSessionData)
  if (!description || !amount) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.demoPayment.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  const token = await createDemoPaymentToken(req.account.id, req.service.externalId, req.account.type, req.user.email)

  const demoProduct = await createDemoProduct(token, req.account.id, description, amount)

  lodash.unset(req, SESSION_KEY)
  res.redirect(demoProduct.links.pay.href)
}

export { get, getMockCardNumber, post, edit, inbound }
