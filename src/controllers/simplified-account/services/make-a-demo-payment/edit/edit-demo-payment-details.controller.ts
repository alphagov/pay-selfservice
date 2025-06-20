import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import lodash from 'lodash'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format/format-validation-errors'
import {
  DemoPaymentSessionData,
  PAYMENT_DEFAULTS,
  SESSION_KEY,
} from '@controllers/simplified-account/services/make-a-demo-payment/constants'
import { demoPaymentSchema } from '@utils/simplified-account/validation/demo-payment.schema'
import { penceToPounds, poundsToPence } from '@utils/currency-formatter'

const DEMO_PAYMENT_INDEX = paths.simplifiedAccount.demoPayment.index

function get(req: ServiceRequest, res: ServiceResponse) {
  const demoPayment = lodash.get(req, SESSION_KEY, PAYMENT_DEFAULTS)
  return response(req, res, 'simplified-account/services/demo-payment/edit/update-payment-details', {
    backLink: formatServiceAndAccountPathsFor(DEMO_PAYMENT_INDEX, req.service.externalId, req.account.type),
    demoPayment: {
      description: demoPayment.description,
      amount: penceToPounds(demoPayment.amount!),
    },
  })
}

interface EditPaymentDetailsBody {
  paymentDescription: string
  paymentAmount: string
}

async function post(req: ServiceRequest<EditPaymentDetailsBody>, res: ServiceResponse) {
  const validations = [demoPaymentSchema.paymentDescription.validate, demoPaymentSchema.paymentAmount.validate]
  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/services/demo-payment/edit/update-payment-details', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: formatServiceAndAccountPathsFor(DEMO_PAYMENT_INDEX, req.service.externalId, req.account.type),
      demoPayment: {
        description: req.body.paymentDescription,
        amount: req.body.paymentAmount,
      },
    })
  }

  lodash.set(req, SESSION_KEY, {
    description: req.body.paymentDescription,
    amount: poundsToPence(parseFloat(req.body.paymentAmount)),
  } as DemoPaymentSessionData)

  res.redirect(formatServiceAndAccountPathsFor(DEMO_PAYMENT_INDEX, req.service.externalId, req.account.type))
}

export { get, post }
