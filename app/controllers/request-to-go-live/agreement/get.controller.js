'use strict'

const lodash = require('lodash')

const goLiveStage = require('../../../models/go-live-stage')
const paths = require('../../../paths')
const { response } = require('../../../utils/response')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

const { CHOSEN_PSP_STRIPE, CHOSEN_PSP_WORLDPAY, CHOSEN_PSP_SMARTPAY, CHOSEN_PSP_EPDQ, CHOSEN_PSP_GOV_BANKING_WORLDPAY } = goLiveStage
const chosenOptions = [CHOSEN_PSP_STRIPE, CHOSEN_PSP_WORLDPAY, CHOSEN_PSP_SMARTPAY, CHOSEN_PSP_EPDQ, CHOSEN_PSP_GOV_BANKING_WORLDPAY]

module.exports = (req, res) => {
  if (chosenOptions.includes(req.service.currentGoLiveStage)) {
    return response(req, res, 'request-to-go-live/agreement', {
      displayStripeAgreement: (lodash.get(req, 'service.currentGoLiveStage', '') === goLiveStage.CHOSEN_PSP_STRIPE)
    })
  }
  return res.redirect(
    // redirect on wrong stage
    303,
    formatServicePathsFor(paths.service.requestToGoLive.index, req.service.externalId)
  )
}
