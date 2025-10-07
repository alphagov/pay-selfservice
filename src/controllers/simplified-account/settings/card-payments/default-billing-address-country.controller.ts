import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { updateDefaultBillingAddressCountry } from '@services/card-payments.service'
import { cardPaymentsSchema } from '@utils/simplified-account/validation/card-payments.schema'
import { GB_COUNTRY_CODE } from '@controllers/simplified-account/settings/card-payments/constants'

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/card-payments/default-billing-address-country', {
    currentState: req.service.defaultBillingAddressCountry === GB_COUNTRY_CODE ? 'on' : 'off',
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

interface DefaultBillingAddressCountryBody {
  defaultBillingAddress: 'on' | 'off'
}

async function post(req: ServiceRequest<DefaultBillingAddressCountryBody>, res: ServiceResponse) {
  await cardPaymentsSchema.defaultBillingAddressCountry.validate.run(req)
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/card-payments/default-billing-address-country', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      currentState: req.service.defaultBillingAddressCountry === GB_COUNTRY_CODE ? 'on' : 'off',
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.cardPayments.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  await updateDefaultBillingAddressCountry(
    req.service.externalId,
    req.body.defaultBillingAddress === 'on' ? GB_COUNTRY_CODE : null
  )

  return res.redirect(
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
