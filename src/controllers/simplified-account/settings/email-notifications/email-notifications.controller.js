const { response } = require('../../../../utils/response')
const formatSimplifiedAccountPathsFor = require('../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

function getEmailNotificationsSettingsPage (req, res) {
  const service = req.service
  const account = req.account

  const context = {
    emailCollectionMode: account.rawResponse.email_collection_mode,
    confirmationEmailEnabled: account.rawResponse.email_notifications?.PAYMENT_CONFIRMED?.enabled ?? false,
    refundEmailEnabled: account.rawResponse.email_notifications?.REFUND_ISSUED?.enabled ?? false,
    editEmailCollectionHref: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.emailCollectionMode,
      service.externalId, account.type),
    editRefundEmailToggleHref: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.refundEmailToggle,
      service.externalId, account.type),
    editPaymentConfirmationEmailToggleHref: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.paymentConfirmationEmailToggle,
      service.externalId, account.type),
    templatesHref: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
      service.externalId, account.type)
  }
  return response(req, res, 'simplified-account/settings/email-notifications/index', context)
}

module.exports = {
  getEmailNotificationsSettingsPage
}
module.exports.emailCollectionMode = require('./email-collection-mode/email-collection-mode.controller')
module.exports.refundEmails = require('./refund-emails/refund-emails.controller')
module.exports.paymentConfirmationEmails = require('./payment-confirmation-emails/payment-confirmation-emails.controller')
module.exports.templates = require('./templates/templates.controller')
module.exports.customParagraph = require('./templates/custom-paragraph.controller')
