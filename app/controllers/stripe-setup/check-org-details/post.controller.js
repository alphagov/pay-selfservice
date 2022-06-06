'use strict'

const lodash = require('lodash')

const { response } = require('../../../utils/response')
const { getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')

// Constants
const CONFIRM_ORG_DETAILS = 'confirm-org-details'

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

  const confirmOrgDetails = lodash.get(req.body, CONFIRM_ORG_DETAILS, '')

  const errors = validateConfirmOrgDetails(confirmOrgDetails)

  if (!lodash.isEmpty(errors)) {
    return response(req, res, 'stripe-setup/check-org-details/index', { errors })
  }
}

function validateConfirmOrgDetails (confirmOrgDetails) {
  const errors = {}

  if (!confirmOrgDetails) {
    errors['confirmOrgDetails'] = 'Select yes if your organisation’s details match the details on your government entity document'
  }

  return errors
}
