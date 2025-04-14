'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, getCurrentCredential, isEnableStripeOnboardingTaskListRoute } = require('../../../utils/credentials')
const { getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')

module.exports = (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
  const currentCredential = getCurrentCredential(req.account)
  const enableStripeOnboardingTaskList = isEnableStripeOnboardingTaskListRoute(req)

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.vatNumber) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already provided your VAT number. Contact GOV.UK Pay support if you need to update it.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  return response(req, res, 'stripe-setup/vat-number/index', { isSwitchingCredentials, enableStripeOnboardingTaskList, currentCredential })
}
