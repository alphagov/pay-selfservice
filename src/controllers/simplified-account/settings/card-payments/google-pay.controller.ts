import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { cardPaymentsSchema } from '@utils/simplified-account/validation/card-payments.schema'
import { updateAllowGooglePay } from '@services/card-payments.service'
import { WORLDPAY } from '@models/constants/payment-providers'
import { updateGooglePayMerchantId } from '@services/worldpay-details.service'

function get(req: ServiceRequest, res: ServiceResponse) {
  response(req, res, 'simplified-account/settings/card-payments/google-pay', {
    currentState: req.account.allowGooglePay ? 'on' : 'off',
    paymentProvider: req.account.paymentProvider,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.index,
      req.service.externalId,
      req.account.type
    ),
    ...(req.account.paymentProvider === WORLDPAY && {
      currentGooglePayMerchantId: req.account.getCurrentCredential()?.credentials?.googlePayMerchantId,
    }),
  })
}

interface GooglePayBody {
  googlePay: 'on' | 'off'
  googlePayMerchantId: string
}

async function post(req: ServiceRequest<GooglePayBody>, res: ServiceResponse) {
  const account = req.account
  const service = req.service
  const user = req.user

  const validations = [cardPaymentsSchema.googlePay.validate, cardPaymentsSchema.googlePayMerchantId.validate]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/card-payments/google-pay', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      currentState: req.body.googlePay,
      currentGooglePayMerchantId: req.body.googlePayMerchantId,
      paymentProvider: account.paymentProvider,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.cardPayments.index,
        service.externalId,
        account.type
      ),
    })
  }

  if (req.body.googlePay === 'on' && account.paymentProvider === WORLDPAY) {
    const googlePayMerchantId = req.body.googlePayMerchantId
    await updateGooglePayMerchantId(
      service.externalId,
      account.type,
      account.getCurrentCredential()!.externalId,
      user.externalId,
      googlePayMerchantId
    )
  }

  await updateAllowGooglePay(service.externalId, account.type, req.body.googlePay === 'on')
  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.index,
      service.externalId,
      account.type
    )
  )
}

module.exports = {
  get,
  post,
}
