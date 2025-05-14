'use strict'

const lodash = require('lodash')

const goLiveStage = require('@models/constants/go-live-stage')
const paths = require('../../../paths')
const { response } = require('../../../utils/response')
const { countries } = require('@govuk-pay/pay-js-commons').utils
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

module.exports = function getOrganisationAddress (req, res) {

  if (req.service.currentGoLiveStage !== goLiveStage.ENTERED_ORGANISATION_NAME) {
    return res.redirect(
      303,
      formatServicePathsFor(paths.service.requestToGoLive.index, req.service.externalId)
    )
  }

  const merchantDetails = lodash.get(req, 'service.merchantDetails')

  const merchantFormDetails = {
        ...lodash.pick(merchantDetails, [
          'name',
          'addressLine1',
          'addressLine2',
          'addressCity',
          'addressPostcode',
          'addressCountry',
          'telephoneNumber',
          'url'
        ])
      }

  const pageData = {
    ...merchantFormDetails,
  }
  pageData.countries = countries.govukFrontendFormatted(lodash.get(pageData, 'addressCountry'))

  return response(req, res, 'request-to-go-live/organisation-address', pageData)
}
