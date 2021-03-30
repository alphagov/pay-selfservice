'use strict'

const lodash = require('lodash')

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const goLiveStage = require('../../../models/go-live-stage')
const paths = require('../../../paths')
const { validateOrganisationName } = require('../../../utils/organisation-name-validation')
const { updateCurrentGoLiveStage, updateService } = require('../../../services/service.service')
const { renderErrorView } = require('../../../utils/response')
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

// Constants
const ORGANISATION_NAME_FIELD = 'organisation-name'

module.exports = (req, res) => {
  const organisationName = lodash.get(req.body, ORGANISATION_NAME_FIELD)
  const errors = validateOrganisationName(organisationName, ORGANISATION_NAME_FIELD, true)
  if (lodash.isEmpty(errors)) {
    const updateServiceRequest = new ServiceUpdateRequest()
      .replace(validPaths.merchantDetails.name, organisationName)
      .formatPayload()

    return updateService(req.service.externalId, updateServiceRequest, req.correlationId)
      .then(service => {
        return updateCurrentGoLiveStage(service.externalId, goLiveStage.ENTERED_ORGANISATION_NAME, req.correlationId)
      })
      .then(updatedService => {
        res.redirect(
          303,
          formatServicePathsFor(goLiveStageToNextPagePath[updatedService.currentGoLiveStage], req.service.externalId)
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
      formatServicePathsFor(paths.service.requestToGoLive.organisationName, req.service.externalId)
    )
  }
}
