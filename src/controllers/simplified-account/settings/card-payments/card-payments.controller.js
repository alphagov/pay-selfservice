const collectBillingAddress = require('./collect-billing-address.controller')
const defaultBillingAddressCountry = require('./default-billing-address-country.controller')
const applePay = require('./apple-pay.controller')
const googlePay = require('./google-pay.controller')
const index = require('./index.controller')

module.exports = {
  get: index.get,
  collectBillingAddress,
  defaultBillingAddressCountry,
  applePay,
  googlePay
}
