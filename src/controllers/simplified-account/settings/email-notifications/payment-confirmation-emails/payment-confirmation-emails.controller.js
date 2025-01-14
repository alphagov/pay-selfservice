const { response } = require('../../../../../utils/response')
const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../../../paths')
const { setConfirmationEnabledByServiceIdAndAccountType } = require('../../../../../services/email.service')
const logger = require('../../../../../utils/logger')(__filename)

function get (req, res) {
  const account = req.account
  response(req, res, 'simplified-account/settings/email-notifications/payment-confirmation-email-toggle', {
    confirmationEnabled: account.rawResponse.email_notifications?.PAYMENT_CONFIRMED?.enabled,
    emailCollectionMode: account.rawResponse.email_collection_mode,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index,
      req.service.externalId, account.type)
  })
}

async function post (req, res) {
  const paymentConfirmationEmailToggle = req.body.paymentConfirmationEmailToggle
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  await setConfirmationEnabledByServiceIdAndAccountType(serviceExternalId, accountType, paymentConfirmationEmailToggle)
  logger.info(`Updated send payment confirmation emails to ${paymentConfirmationEmailToggle}`)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index,
    serviceExternalId, accountType))
}

module.exports = {
  get,
  post
}
