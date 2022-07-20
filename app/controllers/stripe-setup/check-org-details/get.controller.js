'use strict'

const { response } = require('../../../utils/response')
const { getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')
const lodash = require('lodash')

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

  const { merchantDetails } = req.service

  const data = {
    orgName: lodash.get(merchantDetails, 'name', null),
    orgAddressLine1: lodash.get(merchantDetails, 'address_line1', null),
    orgAddressLine2: lodash.get(merchantDetails, 'address_line2', null),
    orgCity: lodash.get(merchantDetails, 'address_city', null),
    orgPostcode: lodash.get(merchantDetails, 'address_postcode', null)
  }

  return response(req, res, 'stripe-setup/check-org-details/index', data)
}
