const paths = require('@root/paths')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { response } = require('@utils/response')
const { GB_COUNTRY_CODE } = require('@controllers/simplified-account/settings/card-payments/constants')

function get (req, res) {
  const service = req.service
  const account = req.account
  const user = req.user
  const country = service.defaultBillingAddressCountry === GB_COUNTRY_CODE ? 'United Kingdom' : 'None'
  const motoSettings = {
    isMoto: account.allowMoto,
    hideCardNumberEnabled: account.motoMaskCardNumber,
    hideCardNumberLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardNumber, service.externalId, account.type),
    hideCardSecurityCodeEnabled: account.motoMaskCardSecurityCode,
    hideCardSecurityCodeLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardSecurityCode, service.externalId, account.type)
  }

  response(req, res, 'simplified-account/settings/card-payments/index', {
    userCanUpdatePaymentTypes: user.hasPermission(service.externalId, 'payment-types:update'),
    collectBillingAddressEnabled: service.collectBillingAddress,
    collectBillingAddressLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.collectBillingAddress, service.externalId, account.type),
    defaultBillingAddressCountry: country,
    defaultBillingAddressCountryLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.defaultBillingAddressCountry, service.externalId, account.type),
    applePayEnabled: account?.allowApplePay,
    applePayLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.applePay, service.externalId, account.type),
    googlePayEnabled: account?.allowGooglePay,
    googlePayLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.googlePay, service.externalId, account.type),
    googlePayEditable: account.getActiveCredential() !== null,
    ...(motoSettings.isMoto && motoSettings)
  })
}

module.exports = {
  get,
  collectBillingAddress: require('./collect-billing-address.controller'),
  defaultBillingAddressCountry: require('./default-billing-address-country.controller'),
  applePay: require('./apple-pay.controller'),
  googlePay: require('./google-pay.controller'),
  motoSecurity: require('./moto-security/index')
}
