'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential } = require('../../../utils/credentials')
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')

module.exports = (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const collectingAdditionalKycData = isAdditionalKycDataRoute(req)
  const currentCredential = getCurrentCredential(req.account)

  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.director) {
    req.flash('genericError', 'You’ve already provided director details. Contact GOV.UK Pay support if you need to change them.')
    return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
  }

  return response(req, res, 'stripe-setup/director/index',
    { isSwitchingCredentials, collectingAdditionalKycData, currentCredential })
}
