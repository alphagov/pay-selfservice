'use strict'

const lodash = require('lodash')

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const goLiveStage = require('../../../models/go-live-stage')
const paths = require('../../../paths')
const { validateMandatoryField } = require('../../../utils/validation/server-side-form-validations')
const { updateCurrentGoLiveStage, updateService } = require('../../../services/service.service')
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

const ORGANISATION_NAME_MAX_LENGTH = 100

module.exports = async function submitOrganisationName (req, res, next) {
  const organisationName = req.body['organisation-name'] && req.body['organisation-name'].trim()
  const validationResult = validateMandatoryField(organisationName, ORGANISATION_NAME_MAX_LENGTH, 'organisation name')
  if (validationResult.valid) {
    const updateServiceRequest = new ServiceUpdateRequest()
      .replace(validPaths.merchantDetails.name, organisationName)
      .formatPayload()

    try {
      await updateService(req.service.externalId, updateServiceRequest)
      const updatedService = await updateCurrentGoLiveStage(req.service.externalId, goLiveStage.ENTERED_ORGANISATION_NAME)
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
      errors: {
        'organisation-name': validationResult.message
      },
      organisationName
    })
    return res.redirect(
      303,
      formatServicePathsFor(paths.service.requestToGoLive.organisationName, req.service.externalId)
    )
  }
}
