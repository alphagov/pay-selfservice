'use strict'

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

module.exports = (req, res) => {
  res.redirect(
    303,
    formatServicePathsFor(goLiveStageToNextPagePath[req.service.currentGoLiveStage], req.service.externalId)
  )
}
