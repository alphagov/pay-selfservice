'use strict'

const lodash = require('lodash')

const goLiveStage = require('../../../models/go-live-stage')
const paths = require('../../../paths')
const { response } = require('../../../utils/response')
const { countries } = require('@govuk-pay/pay-js-commons').utils
const formatServicePathsFor = require('../../../utils/format-service-paths-for')
const { getAlreadySubmittedErrorPageData } = require('../../stripe-setup/stripe-setup.util')

module.exports = function getOrganisationAddress (req, res) {
  const isRequestToGoLive = Object.values(paths.service.requestToGoLive).includes(req.route && req.route.path)

  const isStripeUpdateOrgDetails = paths.account.yourPsp.stripeSetup.updateOrgDetails.includes(req.route && req.route.path)

  if (isRequestToGoLive) {
    if (req.service.currentGoLiveStage !== goLiveStage.ENTERED_ORGANISATION_NAME) {
      return res.redirect(
        303,
        formatServicePathsFor(paths.service.requestToGoLive.index, req.service.externalId)
      )
    }
  }

  if (isStripeUpdateOrgDetails) {
    const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

    if (stripeAccountSetup.organisationDetails) {
      const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
        'You’ve already submitted your organisation details. Contact GOV.UK Pay support if you need to update them.')
      return response(req, res, 'error-with-link', errorPageData)
    }
  }

  const merchantDetails = lodash.get(req, 'service.merchantDetails')

  const merchantFormDetails = !isStripeUpdateOrgDetails ? { ...lodash.pick(merchantDetails, [
    'name',
    'address_line1',
    'address_line2',
    'address_city',
    'address_postcode',
    'address_country',
    'telephone_number',
    'url'
  ]) } : undefined

  const pageData = {
    ...merchantFormDetails,
    isRequestToGoLive,
    isStripeUpdateOrgDetails
  }
  pageData.countries = countries.govukFrontendFormatted(lodash.get(pageData, 'address_country'))
  
  const templatePath = isStripeUpdateOrgDetails ? 'stripe-setup/update-org-details/index' : 'request-to-go-live/organisation-address'
  return response(req, res, templatePath, pageData)
}
