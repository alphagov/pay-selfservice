const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { setEmailCollectionModeByServiceIdAndAccountType } = require('@services/email.service')

function get (req, res) {
  return response(req, res, 'simplified-account/settings/email-notifications/collect-email-page', {
    emailCollectionModes: {
      mandatory: 'MANDATORY',
      optional: 'OPTIONAL',
      no: 'OFF'
    },
    emailCollectionMode: req.account.emailCollectionMode,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const emailCollectionMode = req.body.emailCollectionMode
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  await setEmailCollectionModeByServiceIdAndAccountType(serviceExternalId, accountType, emailCollectionMode)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index,
    serviceExternalId, accountType))
}

module.exports = {
  get,
  post
}
