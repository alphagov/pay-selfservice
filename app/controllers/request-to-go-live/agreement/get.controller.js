'use strict'

const lodash = require('lodash')

const goLiveStage = require('../../../models/go-live-stage')
const { requestToGoLive } = require('../../../paths')
const response = require('../../../utils/response')

const { CHOSEN_PSP_STRIPE, CHOSEN_PSP_WORLDPAY, CHOSEN_PSP_SMARTPAY, CHOSEN_PSP_EPDQ, CHOSEN_PSP_GOV_BANKING_WORLDPAY } = goLiveStage
const chosenOptions = [ CHOSEN_PSP_STRIPE, CHOSEN_PSP_WORLDPAY, CHOSEN_PSP_SMARTPAY, CHOSEN_PSP_EPDQ, CHOSEN_PSP_GOV_BANKING_WORLDPAY ]

module.exports = (req, res) => {
  if (chosenOptions.includes(req.service.currentGoLiveStage)) {
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
