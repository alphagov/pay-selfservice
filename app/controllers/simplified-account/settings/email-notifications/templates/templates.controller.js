const { response } = require('../../../../../utils/response')
const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../../../paths')

function get (req, res) {
  const account = req.account
  response(req, res, 'simplified-account/settings/email-notifications/templates', {
    customEmailText: account.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: account.service_name,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId, account.type)
  })
}

module.exports = {
  get
}
