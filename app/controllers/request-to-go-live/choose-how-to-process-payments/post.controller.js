'use strict'

const lodash = require('lodash')

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const { validateProcessPaymentOptions } = require('../../../utils/choose-how-to-process-payments-validation')
const paths = require('../../../paths')
const { updateCurrentGoLiveStage } = require('../../../services/service.service')
const goLiveStage = require('../../../models/go-live-stage')
const { renderErrorView } = require('../../../utils/response.js')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

const PSP = 'choose-how-to-process-payments-mode'
const PSP_OTHER = 'choose-how-to-process-payments-mode-other'
const stages = {
  stripe: goLiveStage.CHOSEN_PSP_STRIPE,
  worldpay: goLiveStage.CHOSEN_PSP_WORLDPAY,
  smartpay: goLiveStage.CHOSEN_PSP_SMARTPAY,
  epdq: goLiveStage.CHOSEN_PSP_EPDQ,
  gov_banking: goLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY
}

module.exports = (req, res) => {
  const errors = validateProcessPaymentOptions(req.body)
  if (lodash.isEmpty(errors)) {
    const chosenPspStage = figureOutChosenPsp(req.body)
    updateCurrentGoLiveStage(req.service.externalId, chosenPspStage, req.correlationId)
      .then(updatedService => {
        res.redirect(
          303,
          formatServicePathsFor(goLiveStageToNextPagePath[updatedService.currentGoLiveStage], req.service.externalId)
        )
      })
      .catch(err => {
        renderErrorView(req, res, err.message)
      })
  } else {
    req.flash('genericError', errors)
    return res.redirect(
      303,
      formatServicePathsFor(paths.service.requestToGoLive.chooseHowToProcessPayments, req.service.externalId)
    )
  }
}

function figureOutChosenPsp (values) {
  const psp = lodash.get(values, PSP)
  const chosenStage = (psp && psp !== 'other_psp') ? psp : lodash.get(values, PSP_OTHER)

  return stages[chosenStage]
}
