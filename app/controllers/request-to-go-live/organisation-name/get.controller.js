'use strict'

// Local dependencies
const goLiveStage = require('../../../models/go-live-stage')
const { requestToGoLive } = require('../../../paths')
const response = require('../../../utils/response')

module.exports = (req, res) => {
  if (req.service.currentGoLiveStage !== goLiveStage.NOT_STARTED) {
    return res.redirect(
      303,
      requestToGoLive.index.replace(':externalServiceId', req.service.externalId)
    )
  }
  return response.response(req, res, 'request-to-go-live/organisation-name')
}
