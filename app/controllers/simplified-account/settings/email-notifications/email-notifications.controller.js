const { response } = require('../../../../utils/response')
const formatSimplifiedAccountPathsFor = require('../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../../paths')
const { setEmailCollectionModeByServiceIdAndAccountType } = require('../../../../services/email.service')
const logger = require('../../../../utils/logger')(__filename)

function getEmailNotificationsSettingsPage (req, res) {
  const service = req.service
  const account = req.account

  const context = {
    emailCollectionMode: account.email_collection_mode,
    confirmationEmailEnabled: account.email_notifications?.PAYMENT_CONFIRMED?.enabled ?? false,
    refundEmailEnabled: account.email_notifications?.REFUND_ISSUED?.enabled ?? false,
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

function getEditEmailCollectionModePage (req, res) {
  return response(req, res, 'simplified-account/settings/email-notifications/collect-email-page', {
    emailCollectionModes: {
      mandatory: 'MANDATORY',
      optional: 'OPTIONAL',
      no: 'OFF'
    },
    emailCollectionMode: req.account.email_collection_mode,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId, req.account.type)
  })
}

async function postEditEmailCollectionMode (req, res) {
  const emailCollectionMode = req.body.emailCollectionMode
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  await setEmailCollectionModeByServiceIdAndAccountType(serviceExternalId, accountType, emailCollectionMode)
  logger.info(`Updated email collection mode (${emailCollectionMode})`, {
    service: serviceExternalId,
    accountType
  })
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index,
    serviceExternalId, accountType))
}

module.exports = {
  getEmailNotificationsSettingsPage,
  getEditEmailCollectionModePage,
  postEditEmailCollectionMode
}
module.exports.refundEmails = require('./refund-emails/refund-emails.controller')
module.exports.paymentConfirmationEmails = require('./payment-confirmation-emails/payment-confirmation-emails.controller')
module.exports.templates = require('./templates/templates.controller')
module.exports.customParagraph = require('./templates/custom-paragraph.controller')
