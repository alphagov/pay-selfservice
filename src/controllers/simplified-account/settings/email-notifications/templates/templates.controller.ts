import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

function get(req: ServiceRequest, res: ServiceResponse) {
  const messages = res.locals?.flash?.messages ?? []

  response(req, res, 'simplified-account/settings/email-notifications/templates', {
    messages,
    customEmailText: req.account.rawResponse.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: req.service.name,
    customParagraphHref: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.customParagraph,
      req.service.externalId,
      req.account.type
    ),
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

module.exports = {
  get,
}
