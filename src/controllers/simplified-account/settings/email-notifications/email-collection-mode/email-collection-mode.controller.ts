import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { setEmailCollectionModeByServiceIdAndAccountType } from '@services/email.service'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { emailNotificationsSchema } from '@utils/simplified-account/validation/email-notifications.schema'

const emailCollectionModes = {
  mandatory: 'MANDATORY',
  optional: 'OPTIONAL',
  no: 'OFF',
}

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/email-notifications/collect-email-page', {
    emailCollectionModes,
    emailCollectionMode: req.account.emailCollectionMode,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

interface UpdateEmailCollectionModeBody {
  emailCollectionMode: string
}

async function post(req: ServiceRequest<UpdateEmailCollectionModeBody>, res: ServiceResponse) {
  await emailNotificationsSchema.emailCollectionMode.validate.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/email-notifications/collect-email-page', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      emailCollectionModes,
      emailCollectionMode: req.account.emailCollectionMode,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.emailNotifications.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  await setEmailCollectionModeByServiceIdAndAccountType(
    req.service.externalId,
    req.account.type,
    req.body.emailCollectionMode
  )

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
