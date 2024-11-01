const { NotFoundError } = require('../../errors')

module.exports = function enforcePaymentProviderType (paymentProvider) {
  return function (req, res, next) {
    const account = req.account
    if (account.payment_provider !== paymentProvider) {
      next(new NotFoundError(`Attempted to access ${paymentProvider} setting for ${account.payment_provider} service`))
    }
    next()
  }
}
