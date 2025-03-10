const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { updateDefaultBillingAddressCountry } = require('@services/card-payments.service')
const paths = require('@root/paths')
const { GB_COUNTRY_CODE } = require('@controllers/simplified-account/settings/card-payments/constants')
const { validateOnOffToggle } = require('@utils/simplified-account/validation/on-off-toggle')

function get (req, res) {
  const defaultBillingAddressCountry = req.service.defaultBillingAddressCountry
  response(req, res, 'simplified-account/settings/card-payments/default-billing-address-country', {
    currentState: defaultBillingAddressCountry === GB_COUNTRY_CODE ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const { isValid, isOn, errors } = await validateOnOffToggle('defaultBillingAddress', req)
  if (!isValid) {
    const defaultBillingAddressCountry = req.service.defaultBillingAddressCountry
    return response(req, res, 'simplified-account/settings/card-payments/default-billing-address-country', {
      errors: {
        summary: errors.errorSummary,
        formErrors: errors.formErrors
      },
      currentState: defaultBillingAddressCountry === GB_COUNTRY_CODE ? 'on' : 'off',
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
    })
  }
  const serviceExternalId = req.service.externalId
  await updateDefaultBillingAddressCountry(serviceExternalId, isOn ? GB_COUNTRY_CODE : null)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, req.account.type))
}

module.exports = {
  get,
  post
}
