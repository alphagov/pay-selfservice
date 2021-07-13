'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute } = require('../../../utils/credentials')
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')

module.exports = (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.bankAccount) {
    req.flash('genericError', 'You’ve already provided your bank details. Contact GOV.UK Pay support if you need to update them.')
    return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
  }

  return response(req, res, 'stripe-setup/bank-details/index', { isSwitchingCredentials })
}
