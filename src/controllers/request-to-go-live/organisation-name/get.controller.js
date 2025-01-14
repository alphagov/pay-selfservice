'use strict'

const lodash = require('lodash')

const goLiveStage = require('../../../models/go-live-stage')
const paths = require('../../../paths')
const response = require('../../../utils/response')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

module.exports = (req, res) => {
  // redirect on wrong stage
  if (req.service.currentGoLiveStage !== goLiveStage.NOT_STARTED) {
    return res.redirect(
      303,
      formatServicePathsFor(paths.service.requestToGoLive.index, req.service.externalId)
    )
  }
  // initialise pageData
  let pageData = lodash.get(req, 'session.pageData.requestToGoLive.organisationName')
  if (pageData) {
    delete req.session.pageData.requestToGoLive.organisationName
  } else {
    pageData = {
      organisationName: lodash.get(req, 'service.merchantDetails.name', '')
    }
  }
  // render
  return response.response(req, res, 'request-to-go-live/organisation-name', pageData)
}
