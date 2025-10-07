import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { cardPaymentsSchema } from '@utils/simplified-account/validation/card-payments.schema'
import { updateMotoMaskSecurityCode } from '@services/card-payments.service'
import { validationResult } from 'express-validator'
import formatValidationErrors from '../../../../../utils/simplified-account/format/format-validation-errors'

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/card-payments/moto-security/hide-card-security-code', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.index,
      req.service.externalId,
      req.account.type
    ),
    currentState: req.account.motoMaskCardSecurityCode ? 'on' : 'off',
  })
}

interface HideCardSecurityCodeBody {
  hideCardSecurityCode: 'on' | 'off'
}

async function post(req: ServiceRequest<HideCardSecurityCodeBody>, res: ServiceResponse) {
  await cardPaymentsSchema.hideCardSecurityCode.validate.run(req)
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/card-payments/moto-security/hide-card-security-code', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      currentState: req.account.motoMaskCardSecurityCode ? 'on' : 'off',
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.cardPayments.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  await updateMotoMaskSecurityCode(req.service.externalId, req.account.type, req.body.hideCardSecurityCode === 'on')
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
