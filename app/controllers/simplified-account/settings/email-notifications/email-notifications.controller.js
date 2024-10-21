const { response } = require('../../../../utils/response')
const humaniseEmailMode = require('../../../../utils/humanise-email-mode')

function get (req, res) {
  const service = req.service

  const pageData = {
    emailCollectionMode: humaniseEmailMode(req.account.email_collection_mode),
    confirmationEmailEnabled: req.account.email_notifications.PAYMENT_CONFIRMED.enabled,
    refundEmailEnabled: req.account.email_notifications.REFUND_ISSUED && req.account.email_notifications.REFUND_ISSUED.enabled,
    isServiceAdmin: req.user.isAdminUserForService(service.externalId)
  }
  return response(req, res, 'simplified-account/settings/email-notifications/index', pageData)
}

module.exports = {
  get
}
