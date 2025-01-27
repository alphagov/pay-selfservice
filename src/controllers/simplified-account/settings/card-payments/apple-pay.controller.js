const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { ConnectorClient } = require('@services/clients/connector.client')
const { onOrOffToBool } = require('@utils/on-or-off')
const paths = require('@root/paths')

const connector = new ConnectorClient(process.env.CONNECTOR_URL)

function get (req, res) {
  const url = req.originalUrl.split('?')[0]
  const applePay = req.account?.allowApplePay
  response(req, res, 'simplified-account/settings/card-payments/apple-pay', {
    formAction: url,
    currentState: applePay ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const userPreference = onOrOffToBool(req.body.applePay)
  const serviceExternalId = req.service.externalId
  const gatewayAccountId = req.account.id
  await connector.toggleApplePay(gatewayAccountId, userPreference)
  req.flash('update', `Apple Pay successfully ${userPreference ? 'enabled' : 'disabled'}`)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, req.account.type))
}

module.exports = {
  get,
  post
}
