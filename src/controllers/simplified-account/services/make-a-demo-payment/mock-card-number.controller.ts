import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import lodash from 'lodash'
import {
  DemoPaymentSessionData,
  SESSION_KEY,
} from '@controllers/simplified-account/services/make-a-demo-payment/constants'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { response } from '@utils/response'

function get(req: ServiceRequest, res: ServiceResponse) {
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

  return response(req, res, 'simplified-account/services/demo-payment/mock-card-number', {
    paymentProvider: req.account.paymentProvider,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.demoPayment.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

export { get }
