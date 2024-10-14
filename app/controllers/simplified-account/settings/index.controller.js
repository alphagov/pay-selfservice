const formatSimplifiedAccountPathsFor = require('../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../paths')
const { LIVE } = require('../../../models/go-live-stage')

function get (req, res) {
  const account = req.account
  const service = req.service
  const isServiceAdmin = req.user.isAdminUserForService(service.externalId)

  if (!isServiceAdmin || (account.type === 'test' && service.currentGoLiveStage === LIVE)) {
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, req.account.service_id, req.account.type))
  } else {
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.account.service_id, req.account.type))
  }
}

module.exports = {
  get
}
