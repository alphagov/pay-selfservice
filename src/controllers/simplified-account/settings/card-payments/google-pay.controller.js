const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { ConnectorClient } = require('@services/clients/connector.client')
const { onOrOffToBool } = require('@utils/on-or-off')
const paths = require('@root/paths')

const connector = new ConnectorClient(process.env.CONNECTOR_URL)

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
  await connector.toggleGooglePay(gatewayAccountId, userPreference)
  req.flash('update', `Google Pay successfully ${userPreference ? 'enabled' : 'disabled'}`)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type))
}

module.exports = {
  get,
  post
}
