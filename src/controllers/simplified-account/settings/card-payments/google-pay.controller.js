const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { onOrOffToBool } = require('@utils/on-or-off')
const paths = require('@root/paths')
const { toggleGooglePay } = require('@services/card-payments.service')
const flashSuccess = require('@utils/flash-success')

function get (req, res) {
  const url = req.originalUrl.split('?')[0]
  const googlePay = req.account?.allowGooglePay
  response(req, res, 'simplified-account/settings/card-payments/google-pay', {
    formAction: url,
    currentState: googlePay ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const userPreference = onOrOffToBool(req.body.googlePay)
  const gatewayAccountId = req.account.id
  await toggleGooglePay(gatewayAccountId, userPreference)
  flashSuccess(req, `Google Pay successfully ${userPreference ? 'enabled' : 'disabled'}`)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type))
}

module.exports = {
  get,
  post
}
