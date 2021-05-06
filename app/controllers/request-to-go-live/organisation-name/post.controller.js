'use strict'

const lodash = require('lodash')

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const goLiveStage = require('../../../models/go-live-stage')
const paths = require('../../../paths')
const { validateOrganisationName } = require('../../../utils/organisation-name-validation')
const { updateCurrentGoLiveStage, updateService } = require('../../../services/service.service')
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

// Constants
const ORGANISATION_NAME_FIELD = 'organisation-name'

module.exports = async function submitOrganisationName (req, res, next) {
  const organisationName = req.body[ORGANISATION_NAME_FIELD] && req.body[ORGANISATION_NAME_FIELD].trim()
  const errors = validateOrganisationName(organisationName, ORGANISATION_NAME_FIELD, true)
  if (lodash.isEmpty(errors)) {
    const updateServiceRequest = new ServiceUpdateRequest()
      .replace(validPaths.merchantDetails.name, organisationName)
      .formatPayload()

    try {
      await updateService(req.service.externalId, updateServiceRequest, req.correlationId)
      const updatedService = await updateCurrentGoLiveStage(req.service.externalId, goLiveStage.ENTERED_ORGANISATION_NAME, req.correlationId)
      res.redirect(
        303,
        formatServicePathsFor(goLiveStageToNextPagePath[updatedService.currentGoLiveStage], req.service.externalId)
      )
    } catch (err) {
      next(err)
    }
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
