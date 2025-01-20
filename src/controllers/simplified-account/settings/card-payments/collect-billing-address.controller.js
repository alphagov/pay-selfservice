const { response } = require('@utils/response')
const { toggleCollectBillingAddress } = require('@services/service.service')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { onOrOffToBool } = require('@utils/on-or-off')
const paths = require('@root/paths')

function get (req, res) {
  const url = req.originalUrl.split('?')[0]
  response(req, res, 'simplified-account/settings/card-payments/collect-billing-address', {
    formAction: url,
    currentState: req.service.collectBillingAddress ? 'on' : 'off'
  })
}

async function post (req, res) {
  const userPreference = onOrOffToBool(req.body.collectBillingAddress)
  const serviceExternalId = req.service.externalId
  await toggleCollectBillingAddress(serviceExternalId, userPreference)
  req.flash('update', `Collect billing address successfully ${userPreference ? 'enabled' : 'disabled'}`)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, req.account.type))
}

module.exports = {
  get,
  post
}
