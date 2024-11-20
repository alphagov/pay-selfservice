const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

function get (req, res) {
  const account = req.account
  const service = req.service
  const messages = res.locals?.flash?.messages ?? []
  response(req, res, 'simplified-account/settings/email-notifications/templates', {
    messages,
    customEmailText: account.rawResponse.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: service.name,
    customParagraphHref: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.customParagraph,
      req.service.externalId, account.type),
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId, account.type)
  })
}

module.exports = {
  get
}
