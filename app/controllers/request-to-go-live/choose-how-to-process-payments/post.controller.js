'use strict'

const lodash = require('lodash')

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const { validateProcessPaymentOptions } = require('../../../utils/choose_how_to_process_payments_validation')
const { requestToGoLive } = require('../../../paths')
const { updateCurrentGoLiveStage } = require('../../../services/service_service')
const goLiveStage = require('../../../models/go-live-stage')
const { renderErrorView } = require('../../../utils/response.js')

const PSP = 'choose-how-to-process-payments-mode'
const PSP_OTHER = 'choose-how-to-process-payments-mode-other'
const stages = {
  stripe: goLiveStage.CHOSEN_PSP_STRIPE,
  worldpay: goLiveStage.CHOSEN_PSP_WORLDPAY,
  smartpay: goLiveStage.CHOSEN_PSP_SMARTPAY,
  epdq: goLiveStage.CHOSEN_PSP_EPDQ
}

module.exports = (req, res) => {
  const errors = validateProcessPaymentOptions(req.body)
  if (lodash.isEmpty(errors)) {
    const chosenPspStage = figureOutChosenPsp(req.body)
    updateCurrentGoLiveStage(req.service.externalId, chosenPspStage, req.correlationId)
      .then(updatedService => {
        res.redirect(
          303,
          goLiveStageToNextPagePath[updatedService.currentGoLiveStage].replace(':externalServiceId', req.service.externalId)
        )
      })
      .catch(err => {
        renderErrorView(req, res, err.message)
      })
  } else {
    req.flash('genericError', errors)
    return res.redirect(
      303,
      requestToGoLive.chooseHowToProcessPayments.replace(':externalServiceId', req.service.externalId)
    )
  }
}

function figureOutChosenPsp (values) {
  const psp = lodash.get(values, PSP)
  const chosenStage = (psp && psp !== 'other_psp') ? psp : lodash.get(values, PSP_OTHER)

  return stages[chosenStage]
}
