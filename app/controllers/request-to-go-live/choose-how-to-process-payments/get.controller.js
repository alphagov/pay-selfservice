'use strict'

const lodash = require('lodash')

const goLiveStage = require('../../../models/go-live-stage')
const { requestToGoLive } = require('../../../paths')
const response = require('../../../utils/response')

module.exports = (req, res) => {
  // redirect on wrong stage
  if (req.service.currentGoLiveStage !== goLiveStage.ENTERED_ORGANISATION_ADDRESS) {
    return res.redirect(
      303,
      requestToGoLive.index.replace(':externalServiceId', req.service.externalId)
    )
  }
  // initialise pageData
  let pageData = lodash.get(req, 'session.pageData.requestToGoLive.chooseHowToProcessPayments')
  if (pageData) {
    delete req.session.pageData.requestToGoLive.chooseHowToProcessPayments
  } else {
    pageData = {
      chooseHowToProcessPayments: lodash.get(req, 'service.chooseHowToProcessPayments', '')
    }
  }
  // render
  return response.response(req, res, 'request-to-go-live/choose-how-to-process-payments', pageData)
}
