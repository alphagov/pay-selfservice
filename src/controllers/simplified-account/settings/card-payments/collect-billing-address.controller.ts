import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { updateCollectBillingAddress } from '@services/card-payments.service'
import { cardPaymentsSchema } from '@utils/simplified-account/validation/card-payments.schema'

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/card-payments/collect-billing-address', {
    currentState: req.service.collectBillingAddress ? 'on' : 'off',
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

interface BillingAddressToggleBody {
  collectBillingAddress: 'on' | 'off'
}

async function post(req: ServiceRequest<BillingAddressToggleBody>, res: ServiceResponse) {
  await cardPaymentsSchema.billingAddress.validate.run(req)
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/card-payments/collect-billing-address', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      currentState: req.service.collectBillingAddress ? 'on' : 'off',
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.cardPayments.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  await updateCollectBillingAddress(req.service.externalId, req.body.collectBillingAddress === 'on')
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
