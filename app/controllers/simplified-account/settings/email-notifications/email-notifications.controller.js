const { response } = require('../../../../utils/response')
const humaniseEmailMode = require('../../../../utils/humanise-email-mode')

function get (req, res) {
  const service = req.service
  const account = req.account

  const context = {
    email_collection_mode: humaniseEmailMode(account.email_collection_mode),
    confirmation_email_enabled: account.email_notifications.PAYMENT_CONFIRMED.enabled,
    refund_email_enabled: req.account.email_notifications?.REFUND_ISSUED?.enabled ?? false,
    is_service_admin: req.user.isAdminUserForService(service.externalId)
  }
  return response(req, res, 'simplified-account/settings/email-notifications/index', context)
}

module.exports = {
  get
}
