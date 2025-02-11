const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const defaultBillingAddressCountry = require('@controllers/simplified-account/settings/card-payments/default-billing-address-country.controller')

const GB_COUNTRY_CODE = defaultBillingAddressCountry.GB_COUNTRY_CODE

function get (req, res) {
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  const cardPaymentsPaths = paths.simplifiedAccount.settings.cardPayments

  const billing = req.service.collectBillingAddress
  const country = req.service.defaultBillingAddressCountry === GB_COUNTRY_CODE ? 'United Kingdom' : 'None'
  const account = req.account
  const applePay = account?.allowApplePay
  const googlePay = account?.allowGooglePay

  const userCanUpdatePaymentTypes = req.user.hasPermission(serviceExternalId, 'payment-types:update')
  response(req, res, 'simplified-account/settings/card-payments/index', {
    collectBillingAddressEnabled: billing,
    collectBillingAddressLink: formatSimplifiedAccountPathsFor(cardPaymentsPaths.collectBillingAddress, serviceExternalId, accountType),
    defaultBillingAddressCountry: country,
    defaultBillingAddressCountryLink: formatSimplifiedAccountPathsFor(cardPaymentsPaths.defaultBillingAddressCountry, serviceExternalId, accountType),
    applePayEnabled: applePay,
    applePayLink: formatSimplifiedAccountPathsFor(cardPaymentsPaths.applePay, serviceExternalId, accountType),
    googlePayEnabled: googlePay,
    googlePayLink: formatSimplifiedAccountPathsFor(cardPaymentsPaths.googlePay, serviceExternalId, accountType),
    userCanUpdatePaymentTypes
  })
}

module.exports = {
  get
}
