import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

import * as emailCollectionMode from './email-collection-mode/email-collection-mode.controller'
import * as refundEmails from './refund-emails/refund-emails.controller'
import * as paymentConfirmationEmails from './payment-confirmation-emails/payment-confirmation-emails.controller'
import * as templates from './templates/templates.controller'
import * as customParagraph from './templates/custom-paragraph.controller'

function get(req: ServiceRequest, res: ServiceResponse) {
  const context = {
    emailCollectionMode: req.account.emailCollectionMode,
    confirmationEmailEnabled: req.account.emailNotifications.paymentConfirmed.enabled,
    refundEmailEnabled: req.account.emailNotifications.refundIssued.enabled,
    editEmailCollectionHref: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.emailCollectionMode,
      req.service.externalId,
      req.account.type
    ),
    editRefundEmailToggleHref: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.refundEmailToggle,
      req.service.externalId,
      req.account.type
    ),
    editPaymentConfirmationEmailToggleHref: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.paymentConfirmationEmailToggle,
      req.service.externalId,
      req.account.type
    ),
    templatesHref: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.templates,
      req.service.externalId,
      req.account.type
    ),
  }
  return response(req, res, 'simplified-account/settings/email-notifications/index', context)
}

export { get, emailCollectionMode, refundEmails, paymentConfirmationEmails, templates, customParagraph }
