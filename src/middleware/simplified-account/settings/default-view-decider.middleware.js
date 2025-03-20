const { LIVE } = require('@models/constants/go-live-stage')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const serviceSettingsController = require('@controllers/simplified-account/settings')

module.exports = function (req, res) {
  const account = req.account
  const service = req.service
  const isServiceAdmin = req.user.isAdminUserForService(service.externalId)
  const useEmailNotificationsController = !isServiceAdmin || (account.type === 'test' && service.currentGoLiveStage === LIVE)
  if (useEmailNotificationsController) {
    req.url = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, service.externalId, account.type)
    return serviceSettingsController.emailNotifications.get(req, res)
  } else {
    req.url = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, service.externalId, account.type)
    return serviceSettingsController.serviceName.get(req, res)
  }
}
