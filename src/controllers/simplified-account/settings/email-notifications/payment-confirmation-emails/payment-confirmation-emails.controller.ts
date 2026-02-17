import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { emailNotificationsSchema } from '@utils/simplified-account/validation/email-notifications.schema'
import { setConfirmationEnabledByServiceIdAndAccountType } from '@services/email.service'
import logger from '@utils/logger/logger'
const LOGGER = logger(__filename)

function get(req: ServiceRequest, res: ServiceResponse) {
  const account = req.account
  return response(req, res, 'simplified-account/settings/email-notifications/payment-confirmation-email-toggle', {
    confirmationEnabled: req.account.emailNotifications.paymentConfirmed.enabled,
    emailCollectionMode: req.account.emailCollectionMode,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId,
      account.type
    ),
  })
}

interface UpdateConfirmationEmailBody {
  paymentConfirmationEmailToggle: 'true' | 'false'
}

async function post(req: ServiceRequest<UpdateConfirmationEmailBody>, res: ServiceResponse) {
  await emailNotificationsSchema.paymentConfirmationEmailToggle.validate.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/email-notifications/payment-confirmation-email-toggle', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      confirmationEnabled: req.account.emailNotifications.paymentConfirmed.enabled,
      emailCollectionMode: req.account.emailCollectionMode,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.emailNotifications.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  await setConfirmationEnabledByServiceIdAndAccountType(
    req.service.externalId,
    req.account.type,
    req.body.paymentConfirmationEmailToggle
  )
  LOGGER.info(`Updated send payment confirmation emails to ${req.body.paymentConfirmationEmailToggle}`)
  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId,
      req.account.type
    )
  )
}

module.exports = {
  get,
  post,
}
