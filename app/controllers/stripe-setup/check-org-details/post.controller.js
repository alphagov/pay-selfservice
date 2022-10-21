'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const { response } = require('../../../utils/response')
const { getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { getCredentialByExternalId, isSwitchingCredentialsRoute } = require('../../../utils/credentials')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { getStripeAccountId } = require('../stripe-setup.util')

// Constants
const CONFIRM_ORG_DETAILS = 'confirm-org-details'

module.exports = async function postCheckOrgDetails (req, res, next) {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }

  if (stripeAccountSetup.organisationDetails) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already submitted your organisation details. Contact GOV.UK Pay support if you need to update them.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  const confirmOrgDetails = lodash.get(req.body, CONFIRM_ORG_DETAILS, '')

  const errors = validateConfirmOrgDetails(confirmOrgDetails)

  if (!lodash.isEmpty(errors)) {
    const { merchantDetails } = req.service

    const data = {
      errors: errors,
      orgName: merchantDetails.name,
      orgAddressLine1: merchantDetails.address_line1,
      orgAddressLine2: merchantDetails.address_line2,
      orgCity: merchantDetails.address_city,
      orgPostcode: merchantDetails.address_postcode,
      isSwitchingCredentials
    }

    return response(req, res, 'stripe-setup/check-org-details/index', data)
  }

  const credential = getCredentialByExternalId(req.account, req.params.credentialId)

  if (confirmOrgDetails === 'yes') {
    try {
      const stripeAccountId = await getStripeAccountId(req.account, false, req.correlationId)

      await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'organisation_details', req.correlationId)

      logger.info('Organisation details confirmed for Stripe account', {
        stripe_account_id: stripeAccountId
      })
    } catch (error) {
      next(error)
    }

    if (isSwitchingCredentials) {
      return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
    } else {
      return res.redirect(303, formatAccountPathsFor(paths.account.stripe.addPspAccountDetails, req.account.external_id))
    }
  } else {
    if (isSwitchingCredentials) {
      return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.stripeSetup.updateOrgDetails, req.account.external_id, credential.external_id))
    } else {
      return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.stripeSetup.updateOrgDetails, req.account.external_id, credential.external_id))
    }
  }
}

function validateConfirmOrgDetails (confirmOrgDetails) {
  const errors = {}

  if (!confirmOrgDetails) {
    errors['confirmOrgDetails'] = 'Select yes if your organisation’s details match the details on your government entity document'
  }

  return errors
}
