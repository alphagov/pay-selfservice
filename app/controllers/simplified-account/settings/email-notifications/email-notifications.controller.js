const { response } = require('../../../../utils/response')
const humaniseEmailMode = require('../../../../utils/humanise-email-mode')
const formatSimplifiedAccountPathsFor = require('../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../../paths')
const { setEmailCollectionModeByServiceIdAndAccountType } = require('../../../../services/email.service')
const logger = require('../../../../utils/logger')(__filename)

function getEmailNotificationsSettingsPage (req, res) {
  const service = req.service
  const account = req.account

  const context = {
    emailCollectionMode: humaniseEmailMode(account.email_collection_mode),
    confirmationEmailEnabled: account.email_notifications?.PAYMENT_CONFIRMED?.enabled ?? false,
    refundEmailEnabled: account.email_notifications?.REFUND_ISSUED?.enabled ?? false,
    isServiceAdmin: req.user.isAdminUserForService(service.externalId),
    editEmailCollectionHref: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.collectionSettings, service.externalId, account.type)
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
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, req.service.externalId, req.account.type)
  })
}

async function postEditEmailCollectionMode (req, res) {
  const emailCollectionMode = req.body['email-collection-mode']
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  await setEmailCollectionModeByServiceIdAndAccountType(serviceExternalId, accountType, emailCollectionMode)
  logger.info(`Updated email collection mode (${emailCollectionMode})`, {
    service: serviceExternalId,
    accountType
  })
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, serviceExternalId, accountType))
}

module.exports = {
  getEmailNotificationsSettingsPage,
  getEditEmailCollectionModePage,
  postEditEmailCollectionMode
}
