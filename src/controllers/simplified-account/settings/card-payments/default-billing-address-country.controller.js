const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { onOrOffToBool } = require('@utils/on-or-off')
const paths = require('@root/paths')
const { updateDefaultBillingAddressCountry } = require('@services/card-payments.service')
const flashSuccess = require('@utils/flash-success')
const GB_COUNTRY_CODE = 'GB'

function get (req, res) {
  const url = req.originalUrl.split('?')[0]
  response(req, res, 'simplified-account/settings/card-payments/default-billing-address-country', {
    formAction: url,
    currentState: req.service.defaultBillingAddressCountry === GB_COUNTRY_CODE ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const userPreference = onOrOffToBool(req.body.defaultBillingAddress)
  const serviceExternalId = req.service.externalId
  await updateDefaultBillingAddressCountry(serviceExternalId, userPreference ? 'GB' : null)
  flashSuccess(req, `Default billing address country successfully ${userPreference ? 'enabled' : 'disabled'}`)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, req.account.type))
}

module.exports = {
  get,
  post,
  GB_COUNTRY_CODE
}
