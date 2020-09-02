'use strict'

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')

module.exports = (req, res) => {
  res.redirect(
    303,
    goLiveStageToNextPagePath[req.service.currentGoLiveStage].replace(':externalServiceId', req.service.externalId)
  )
}
