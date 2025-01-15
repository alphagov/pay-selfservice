'use strict'

const { response } = require('../../utils/response')
const { NOT_STARTED, CREATED, REQUEST_SUBMITTED } = require('../../models/psp-test-account-stage')
const goLiveStage = require('../../models/go-live-stage')

module.exports = function getRequestPspTestAccount (req, res, next) {
  const service = req.service
  try {
    const pageData = {
      requestForPspTestAccountNotStarted: (service.currentPspTestAccountStage === NOT_STARTED || !service.currentPspTestAccountStage) && service.currentGoLiveStage !== goLiveStage.LIVE,
      requestForPspTestAccountSubmitted: service.currentPspTestAccountStage === REQUEST_SUBMITTED,
      pspTestAccountCreated: service.currentPspTestAccountStage === CREATED,
      isServiceLive: service.currentGoLiveStage === goLiveStage.LIVE
    }

    return response(req, res, 'request-psp-test-account/index', pageData)
  } catch (error) {
    return next(error)
  }
}
