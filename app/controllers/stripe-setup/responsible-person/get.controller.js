'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential } = require('../../../utils/credentials')
const { getAlreadySubmittedErrorPageData, getStripeAccountId } = require('../stripe-setup.util')
const { listPersons } = require('../../../services/clients/stripe/stripe.client')

const collectAdditionalKycData = process.env.COLLECT_ADDITIONAL_KYC_DATA === 'true'

async function getExistingResponsiblePersonName(account, isSwitchingCredentials, correlationId) {
  const stripeAccountId = await getStripeAccountId(account, isSwitchingCredentials, correlationId)
  const personsResponse = await listPersons(stripeAccountId)
  const responsiblePerson = personsResponse.data.filter(person => person.relationship && person.relationship.representative).pop()
  if (!responsiblePerson) {
    throw new Error('No responsible person exists for Stripe account')
  }
  return `${responsiblePerson.first_name} ${responsiblePerson.last_name}`
}

module.exports = async function showResponsiblePersonForm(req, res, next) {
  const { change } = req.query || {}

  try {
    const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
    const isSubmittingAdditionalKycData = isAdditionalKycDataRoute(req)
    const currentCredential = getCurrentCredential(req.account)

    if (isSubmittingAdditionalKycData) {
      if (change) {
        return response(req, res, 'stripe-setup/responsible-person/index', {
          isSwitchingCredentials,
          isSubmittingAdditionalKycData,
          collectAdditionalKycData,
          currentCredential
        })
      } else {
        const responsiblePersonName = await getExistingResponsiblePersonName(req.account, isSwitchingCredentials, req.correlationId)
        return response(req, res, 'stripe-setup/responsible-person/kyc-additional-information', {
          responsiblePersonName,
          currentCredential
        })
      }
    } else {
      const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

      if (!stripeAccountSetup) {
        return next(new Error('Stripe setup progress is not available on request'))
      }
      if (stripeAccountSetup.responsiblePerson) {
        const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
          'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
        return response(req, res, 'error-with-link', errorPageData)
      }

      return response(req, res, 'stripe-setup/responsible-person/index', {
        isSwitchingCredentials,
        isSubmittingAdditionalKycData,
        collectAdditionalKycData,
        currentCredential
      })
    }
  } catch (err) {
    next(err)
  }
}
