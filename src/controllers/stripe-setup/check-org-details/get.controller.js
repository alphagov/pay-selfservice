'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, getCurrentCredential, isEnableStripeOnboardingTaskListRoute } = require('../../../utils/credentials')
const { getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')
const lodash = require('lodash')

module.exports = (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
  const currentCredential = getCurrentCredential(req.account)
  const enableStripeOnboardingTaskList = isEnableStripeOnboardingTaskListRoute(req)
  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }

  if (stripeAccountSetup.organisationDetails) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already submitted your organisation details. Contact GOV.UK Pay support if you need to update them.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  const { merchantDetails } = req.service

  const data = {
    orgName: lodash.get(merchantDetails, 'name', ''),
    orgAddressLine1: lodash.get(merchantDetails, 'address_line1', ''),
    orgAddressLine2: lodash.get(merchantDetails, 'address_line2', ''),
    orgCity: lodash.get(merchantDetails, 'address_city', ''),
    orgPostcode: lodash.get(merchantDetails, 'address_postcode', ''),
    isSwitchingCredentials,
    enableStripeOnboardingTaskList,
    currentCredential
  }

  return response(req, res, 'stripe-setup/check-org-details/index', data)
}
