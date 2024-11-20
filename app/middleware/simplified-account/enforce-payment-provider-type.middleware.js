const { NotFoundError } = require('@root/errors')

module.exports = function enforcePaymentProviderType (paymentProvider) {
  return function (req, res, next) {
    const account = req.account
    if (account.paymentProvider !== paymentProvider) {
      next(new NotFoundError(`Attempted to access ${paymentProvider} setting for ${account.paymentProvider} service`))
    }
    next()
  }
}
