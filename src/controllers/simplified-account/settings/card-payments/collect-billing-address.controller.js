const { response } = require('@utils/response')
const { updateCollectBillingAddress } = require('@services/card-payments.service')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { onOrOffToBool } = require('@utils/on-or-off')
const paths = require('@root/paths')
const flashSuccess = require('@utils/flash-success')

function get (req, res) {
  const url = req.originalUrl.split('?')[0]
  response(req, res, 'simplified-account/settings/card-payments/collect-billing-address', {
    formAction: url,
    currentState: req.service.collectBillingAddress ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const userPreference = onOrOffToBool(req.body.collectBillingAddress)
  const serviceExternalId = req.service.externalId
  await updateCollectBillingAddress(serviceExternalId, userPreference)
  flashSuccess(req, `Collect billing address successfully ${userPreference ? 'enabled' : 'disabled'}`)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, req.account.type))
}

module.exports = {
  get,
  post
}
