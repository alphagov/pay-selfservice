const { response } = require('../../../../utils/response')
const humaniseEmailMode = require('../../../../utils/humanise-email-mode')

function get (req, res) {
  const service = req.service
  const account = req.account

  const context = {
    emailCollectionMode: humaniseEmailMode(account.email_collection_mode),
    confirmationEmailEnabled: account.email_notifications?.PAYMENT_CONFIRMED?.enabled ?? false,
    refundEmailEnabled: account.email_notifications?.REFUND_ISSUED?.enabled ?? false,
    isServiceAdmin: req.user.isAdminUserForService(service.externalId)
  }
  return response(req, res, 'simplified-account/settings/email-notifications/index', context)
}

module.exports = {
  get
}
