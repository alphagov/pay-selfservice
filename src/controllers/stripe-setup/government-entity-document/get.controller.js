'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, getCurrentCredential, isEnableStripeOnboardingTaskListRoute } = require('../../../utils/credentials')
const { getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')

module.exports = (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const currentCredential = getCurrentCredential(req.account)
  const enableStripeOnboardingTaskList = isEnableStripeOnboardingTaskListRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.governmentEntityDocument) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already provided a government entity document. Contact GOV.UK Pay support if you need to update it.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  return response(req, res, 'stripe-setup/government-entity-document/index',
    { isSwitchingCredentials, currentCredential, enableStripeOnboardingTaskList })
}
