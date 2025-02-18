const { getConnectorStripeAccountSetup } = require('@services/stripe-details.service')

module.exports = async function (req, res, next) {
  const account = req.account
  const service = req.service
  return getConnectorStripeAccountSetup(service.externalId, account.type)
    .then((data) => {
      req.gatewayAccountStripeProgress = data
      next()
    })
    .catch(err => next(err))
}
