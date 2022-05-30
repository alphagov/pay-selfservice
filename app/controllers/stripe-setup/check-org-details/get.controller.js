'use strict'

const { response } = require('../../../utils/response')
const { getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')

module.exports = (req, res, next) => {
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }

  if (stripeAccountSetup.organisationDetails) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already submitted your organisation details. Contact GOV.UK Pay support if you need to update them.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  return response(req, res, 'stripe-setup/check-org-details/index')
}
