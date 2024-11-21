const { LIVE } = require('@models/go-live-stage')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const serviceSettingsController = require('@controllers/simplified-account/settings')

module.exports = function (req, res, next) {
  const account = req.account
  const service = req.service
  const isServiceAdmin = req.user.isAdminUserForService(service.externalId)
  const useEmailNotificationsController = !isServiceAdmin || (account.type === 'test' && service.currentGoLiveStage === LIVE)
  if (useEmailNotificationsController) {
    req.url = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, service.externalId, account.type)
    req.selectedController = serviceSettingsController.emailNotifications.getEmailNotificationsSettingsPage
  } else {
    req.url = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, service.externalId, account.type)
    req.selectedController = serviceSettingsController.serviceName.get
  }
  next()
}
