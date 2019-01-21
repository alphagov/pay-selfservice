'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const { requestToGoLive } = require('../../../paths')

// Constants
const REQUEST_ORGANISATION_NAME_FIELD = 'organisation-name'

module.exports = (req, res) => {
  const errors = validateRequest(req)
  if (lodash.isEmpty(errors)) {
    // TODO: handle submission
    res.redirect(
      303,
      goLiveStageToNextPagePath[req.service.currentGoLiveStage].replace(':externalServiceId', req.service.externalId)
    )
  } else {
    lodash.set(req, 'session.pageData.requestToGoLive.organisationName', {
      success: false,
      errors: errors,
      organisationName: req.body[REQUEST_ORGANISATION_NAME_FIELD]
    })
    return res.redirect(
      303,
      requestToGoLive.organisationName.replace(':externalServiceId', req.service.externalId)
    )
  }
}

function validateRequest (req) {
  const mandatoryFields = [REQUEST_ORGANISATION_NAME_FIELD]

  return validateNotEmpty(req, mandatoryFields)
}

function validateNotEmpty (req, fieldNames) {
  const errors = {}
  fieldNames.forEach(fieldName => {
    let field = req.body[fieldName]
    if (!field || typeof field !== 'string') {
      errors[fieldName] = true
    }
  })
  return errors
}
