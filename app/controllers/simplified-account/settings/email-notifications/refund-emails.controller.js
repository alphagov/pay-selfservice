const { response } = require('../../../../utils/response')
const formatSimplifiedAccountPathsFor = require('../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../../paths')
const { setRefundEmailEnabledByServiceIdAndAccountType } = require('../../../../services/email.service')
const logger = require('../../../../utils/logger')(__filename)

function get (req, res) {
  const account = req.account
  response(req, res, 'simplified-account/settings/email-notifications/refund-email-toggle', {
    refundEmailEnabled: account.email_notifications.REFUND_ISSUED && req.account.email_notifications.REFUND_ISSUED.enabled,
    emailCollectionMode: account.email_collection_mode,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, req.service.externalId, account.type)
  })
}

async function post (req, res) {
  const refundEmailToggle = req.body.refundEmailToggle
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  await setRefundEmailEnabledByServiceIdAndAccountType(serviceExternalId, accountType, refundEmailToggle)
  logger.info(`Updated send refund emails to ${refundEmailToggle}`)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, serviceExternalId, accountType))
}

module.exports = {
  get,
  post
}
