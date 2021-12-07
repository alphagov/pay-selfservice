'use strict'

const lodash = require('lodash')

const goLiveStage = require('../../../models/go-live-stage')
const paths = require('../../../paths')
const response = require('../../../utils/response')
const { countries } = require('@govuk-pay/pay-js-commons').utils
const formatServicePathsFor = require('../../../utils/format-service-paths-for')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential } = require('../../../utils/credentials')

module.exports = function getOrganisationAddress (req, res) {
  const isRequestToGoLive = Object.values(paths.service.requestToGoLive).includes(req.route && req.route.path)
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const collectingAdditionalKycData = isAdditionalKycDataRoute(req)
  const currentCredential = getCurrentCredential(req.account)

  if (isRequestToGoLive) {
    if (req.service.currentGoLiveStage !== goLiveStage.ENTERED_ORGANISATION_NAME) {
      return res.redirect(
        303,
        formatServicePathsFor(paths.service.requestToGoLive.index, req.service.externalId)
      )
    }
  }

  const merchantDetails = lodash.get(req, 'service.merchantDetails')
  const pageData = {
    ...lodash.pick(merchantDetails, [
      'name',
      'address_line1',
      'address_line2',
      'address_city',
      'address_postcode',
      'address_country',
      'telephone_number',
      'url'
    ]),
    isRequestToGoLive
  }

  if (isSwitchingCredentials || collectingAdditionalKycData) {
    pageData.currentCredential = currentCredential
    pageData.isSwitchingCredentials = isSwitchingCredentials
    pageData.collectingAdditionalKycData = collectingAdditionalKycData
  }

  pageData.countries = countries.govukFrontendFormatted(lodash.get(pageData, 'address_country'))
  return response.response(req, res, 'request-to-go-live/organisation-address', pageData)
}
