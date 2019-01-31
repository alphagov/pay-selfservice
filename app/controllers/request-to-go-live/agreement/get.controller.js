'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const goLiveStage = require('../../../models/go-live-stage')
const { requestToGoLive } = require('../../../paths')
const response = require('../../../utils/response')

module.exports = (req, res) => {
  if (req.service.currentGoLiveStage === goLiveStage.CHOSEN_PSP_STRIPE ||
      req.service.currentGoLiveStage === goLiveStage.CHOSEN_PSP_WORLDPAY ||
      req.service.currentGoLiveStage === goLiveStage.CHOSEN_PSP_SMARTPAY ||
      req.service.currentGoLiveStage === goLiveStage.CHOSEN_PSP_EPDQ) {
    // initialise pageData
    let pageData = lodash.get(req, 'session.pageData.requestToGoLive.agreement')
    if (pageData) {
      delete req.session.pageData.requestToGoLive.agreement
    }
    pageData = {
      displayStripeAgreement: (lodash.get(req, 'service.currentGoLiveStage', '') === goLiveStage.CHOSEN_PSP_STRIPE)
    }
    // render
    return response.response(req, res, 'request-to-go-live/agreement', pageData)
  }
  return res.redirect(
    // redirect on wrong stage
    303,
    requestToGoLive.index.replace(':externalServiceId', req.service.externalId)
  )
}
