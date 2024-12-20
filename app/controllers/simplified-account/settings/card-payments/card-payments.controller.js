const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

const GB_COUNTRY_CODE = 'GB'

function get (req, res) {
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  const cardPaymentsPaths = paths.simplifiedAccount.settings.cardPayments

  const billing = req.service.collectBillingAddress
  const country = req.service.defaultBillingAddressCountry === GB_COUNTRY_CODE ? 'United Kingdom' : req.service.defaultBillingAddressCountry
  const raw = req.account?.rawResponse
  const applePay = raw?.allow_apple_pay
  const googlePay = raw?.allow_google_pay

  response(req, res, 'simplified-account/settings/card-payments/index', {
    collectBillingAddressEnabled: billing,
    collectBillingAddressLink: formatSimplifiedAccountPathsFor(cardPaymentsPaths.collectBillingAddress, serviceExternalId, accountType),
    defaultBillingAddressCountry: country,
    defaultBillingAddressCountryLink: formatSimplifiedAccountPathsFor(cardPaymentsPaths.defaultBillingAddressCountry, serviceExternalId, accountType),
    applePayEnabled: applePay,
    applePayAddressLink: formatSimplifiedAccountPathsFor(cardPaymentsPaths.applePay, serviceExternalId, accountType),
    googlePayEnabled: googlePay,
    googlePayAddressLink: formatSimplifiedAccountPathsFor(cardPaymentsPaths.googlePay, serviceExternalId, accountType)
  })
}

module.exports = {
  get
}
