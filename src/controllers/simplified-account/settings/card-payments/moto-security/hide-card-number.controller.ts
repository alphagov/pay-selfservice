import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { cardPaymentsSchema } from '@utils/simplified-account/validation/card-payments.schema'
import { updateMotoMaskCardNumber } from '@services/card-payments.service'
import { validationResult } from 'express-validator'
import formatValidationErrors from '../../../../../utils/simplified-account/format/format-validation-errors'

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/card-payments/moto-security/hide-card-number', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.index,
      req.service.externalId,
      req.account.type
    ),
    currentState: req.account.motoMaskCardNumber ? 'on' : 'off',
  })
}

interface HideCardNumberBody {
  hideCardNumber: 'on' | 'off'
}

async function post(req: ServiceRequest<HideCardNumberBody>, res: ServiceResponse) {
  await cardPaymentsSchema.hideCardNumber.validate.run(req)
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/card-payments/moto-security/hide-card-number', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      currentState: req.account.motoMaskCardNumber ? 'on' : 'off',
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.cardPayments.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  await updateMotoMaskCardNumber(req.service.externalId, req.account.type, req.body.hideCardNumber === 'on')
  res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.index,
      req.service.externalId,
      req.account.type
    )
  )
}

module.exports = {
  get,
  post,
}
