'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential } = require('../../../utils/credentials')
const { getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')

const collectAdditionalKycData = process.env.COLLECT_ADDITIONAL_KYC_DATA === 'true'

module.exports = async function showResponsiblePersonForm(req, res, next) {
  try {
    const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
    const isSubmittingAdditionalKycData = isAdditionalKycDataRoute(req)
    const currentCredential = getCurrentCredential(req.account)

    if (!isSubmittingAdditionalKycData) {
      const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

      if (!stripeAccountSetup) {
        return next(new Error('Stripe setup progress is not available on request'))
      }
      if (stripeAccountSetup.responsiblePerson) {
        const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
          'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
        return response(req, res, 'error-with-link', errorPageData)
      }
    }

    return response(req, res, 'stripe-setup/responsible-person/index', {
      isSwitchingCredentials,
      isSubmittingAdditionalKycData,
      collectAdditionalKycData,
      currentCredential
    })
  } catch (err) {
    next(err)
  }
}
