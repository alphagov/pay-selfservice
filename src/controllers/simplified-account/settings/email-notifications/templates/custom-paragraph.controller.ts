import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { emailNotificationsSchema } from '@utils/simplified-account/validation/email-notifications.schema'
import { updateCustomParagraphByServiceIdAndAccountType } from '@services/email.service'

import * as remove from './remove-custom-paragraph.controller'

function get(req: ServiceRequest, res: ServiceResponse) {
  response(req, res, 'simplified-account/settings/email-notifications/custom-paragraph', {
    customParagraph: req.account.emailNotifications.paymentConfirmed.templateBody,
    serviceName: req.service.name,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.templates,
      req.service.externalId,
      req.account.type
    ),
    removeCustomParagraphLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.removeCustomParagraph,
      req.service.externalId,
      req.account.type
    ),
  })
}

interface UpdateCustomParagraphBody {
  customParagraph: string
}

async function post(req: ServiceRequest<UpdateCustomParagraphBody>, res: ServiceResponse) {
  await emailNotificationsSchema.customParagraph.validate.run(req)
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/email-notifications/custom-paragraph', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      customParagraph: req.body.customParagraph,
      serviceName: req.service.name,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.emailNotifications.templates,
        req.service.externalId,
        req.account.type
      ),
      removeCustomParagraphLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.emailNotifications.removeCustomParagraph,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  await updateCustomParagraphByServiceIdAndAccountType(
    req.service.externalId,
    req.account.type,
    req.body.customParagraph
  )

  if (req.body.customParagraph && req.body.customParagraph.length > 0) {
    req.flash('messages', { state: 'success', icon: '&check;', heading: 'Custom paragraph updated' })
  }

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.templates,
      req.service.externalId,
      req.account.type
    )
  )
}

module.exports = {
  get,
  post,
  remove,
}
