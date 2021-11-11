'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute } = require('../../../utils/credentials')
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')

const collectAdditionalKycData = process.env.COLLECT_ADDITIONAL_KYC_DATA === 'true'

module.exports = (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.responsiblePerson) {
    req.flash('genericError', 'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
    return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
  }

  return response(req, res, 'stripe-setup/responsible-person/index', {
    isSwitchingCredentials,
    collectAdditionalKycData
  })
}
