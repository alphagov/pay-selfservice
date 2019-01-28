'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const { validateProcessPaymentOptions } = require('../../../utils/choose_how_to_process_payments_validation')
const { requestToGoLive } = require('../../../paths')

module.exports = (req, res) => {
  const errors = validateProcessPaymentOptions(req.body)
  if (lodash.isEmpty(errors)) {
    // TODO implement adminusers update
    res.redirect(
      303,
      goLiveStageToNextPagePath[req.service.currentGoLiveStage].replace(':externalServiceId', req.service.externalId)
    )
  } else {
    req.flash('genericError', errors)
    return res.redirect(
      303,
      requestToGoLive.chooseHowToProcessPayments.replace(':externalServiceId', req.service.externalId)
    )
  }
}
