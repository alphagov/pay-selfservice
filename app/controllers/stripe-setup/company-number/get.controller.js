'use strict'

const { response } = require('../../../utils/response')
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')

module.exports = (req, res, next) => {
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
  // if (!stripeAccountSetup) {
  //   return next(new Error('Stripe setup progress is not available on request'))
  // }
  // if (stripeAccountSetup.companyNumber) {
  //   req.flash('genericError', 'You’ve already provided your company registration number. Contact GOV.UK Pay support if you need to update it.')
  //   return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
  // }

  return response(req, res, 'stripe-setup/company-number/index')
}
