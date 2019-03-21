'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const goLiveStage = require('../../../models/go-live-stage')
const { requestToGoLive } = require('../../../paths')
const { validateOrganisationName } = require('../../../utils/organisation_name_validation')
const { updateCurrentGoLiveStage, updateMerchantDetails } = require('../../../services/service_service')
const { renderErrorView } = require('../../../utils/response')
// Constants
const ORGANISATION_NAME_FIELD = 'organisation-name'

module.exports = (req, res) => {
  const organisationName = lodash.get(req.body, ORGANISATION_NAME_FIELD)
  const errors = validateOrganisationName(organisationName, ORGANISATION_NAME_FIELD, true)
  if (lodash.isEmpty(errors)) {
    const merchantDetails = { name: organisationName }
    return updateMerchantDetails(req.service.externalId, merchantDetails, req.correlationId)
      .then(service => {
        return updateCurrentGoLiveStage(service.externalId, goLiveStage.ENTERED_ORGANISATION_NAME, req.correlationId)
      })
      .then(updatedService => {
        res.redirect(
          303,
          goLiveStageToNextPagePath[updatedService.currentGoLiveStage].replace(':externalServiceId', req.service.externalId)
        )
      })
      .catch(err => {
        renderErrorView(req, res, err.message)
      })
  } else {
    lodash.set(req, 'session.pageData.requestToGoLive.organisationName', {
      success: false,
      errors: errors,
      organisationName: req.body[ORGANISATION_NAME_FIELD]
    })
    return res.redirect(
      303,
      requestToGoLive.organisationName.replace(':externalServiceId', req.service.externalId)
    )
  }
}
