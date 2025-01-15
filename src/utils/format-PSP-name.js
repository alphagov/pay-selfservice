'use strict'

module.exports = paymentProvider => {
  if (paymentProvider === undefined) return
  switch (paymentProvider) {
    case 'epdq': // epqd => ePDQ
      return paymentProvider.charAt(0) + paymentProvider.slice(1).toUpperCase()

    default: // worldpay => Worldpay
      return paymentProvider.charAt(0).toUpperCase() + paymentProvider.slice(1)
  }
}
