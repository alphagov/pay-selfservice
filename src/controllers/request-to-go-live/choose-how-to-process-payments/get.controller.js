'use strict'

const goLiveStage = require('../../../models/go-live-stage')
const paths = require('../../../paths')
const response = require('../../../utils/response')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

module.exports = (req, res) => {
  // redirect on wrong stage
  if (req.service.currentGoLiveStage !== goLiveStage.ENTERED_ORGANISATION_ADDRESS) {
    return res.redirect(
      303,
      formatServicePathsFor(paths.service.requestToGoLive.index, req.service.externalId)
    )
  }
  return response.response(req, res, 'request-to-go-live/choose-how-to-process-payments')
}
