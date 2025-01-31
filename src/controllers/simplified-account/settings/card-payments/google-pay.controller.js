const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { onOrOffToBool } = require('@utils/on-or-off')
const paths = require('@root/paths')
const { updateGooglePay } = require('@services/card-payments.service')

function get (req, res) {
  const googlePay = req.account?.allowGooglePay
  response(req, res, 'simplified-account/settings/card-payments/google-pay', {
    currentState: googlePay ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const userPreference = onOrOffToBool(req.body.googlePay)
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  await updateGooglePay(serviceExternalId, accountType, userPreference)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, accountType))
}

module.exports = {
  get,
  post
}
