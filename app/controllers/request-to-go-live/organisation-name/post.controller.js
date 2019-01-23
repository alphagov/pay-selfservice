'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const { requestToGoLive } = require('../../../paths')
const { validateOrganisationName } = require('../../../utils/organisation_name_validation')

// Constants
const REQUEST_ORGANISATION_NAME_FIELD = 'organisation-name'

module.exports = (req, res) => {
  const organisationName = lodash.get(req, 'body.organisation-name')
  const errors = validateOrganisationName(organisationName, REQUEST_ORGANISATION_NAME_FIELD, true)

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
