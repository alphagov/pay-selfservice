import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { emailNotificationsSchema } from '@utils/simplified-account/validation/email-notifications.schema'
import { setRefundEmailEnabledByServiceIdAndAccountType } from '@services/email.service'
import logger from '@utils/logger/logger'
const LOGGER = logger(__filename)

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/email-notifications/refund-email-toggle', {
    refundEmailEnabled: req.account.emailNotifications.refundIssued.enabled,
    emailCollectionMode: req.account.emailCollectionMode,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

interface UpdateRefundEmailBody {
  refundEmailToggle: 'true' | 'false'
}

async function post(req: ServiceRequest<UpdateRefundEmailBody>, res: ServiceResponse) {
  await emailNotificationsSchema.refundEmailToggle.validate.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/email-notifications/refund-email-toggle', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      refundEmailEnabled: req.account.emailNotifications.refundIssued.enabled,
      emailCollectionMode: req.account.emailCollectionMode,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.emailNotifications.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  await setRefundEmailEnabledByServiceIdAndAccountType(
    req.service.externalId,
    req.account.type,
    req.body.refundEmailToggle
  )
  LOGGER.info(`Updated send refund emails to ${req.body.refundEmailToggle}`)
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
