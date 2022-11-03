'use strict'

const lodash = require('lodash')

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const { updateCurrentGoLiveStage } = require('../../../services/service.service')
const goLiveStage = require('../../../models/go-live-stage')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')
const response = require('../../../utils/response')

const PSP = 'choose-how-to-process-payments-mode'
const PSP_OTHER = 'choose-how-to-process-payments-mode-other'
const stages = {
  stripe: goLiveStage.CHOSEN_PSP_STRIPE,
  worldpay: goLiveStage.CHOSEN_PSP_WORLDPAY,
  smartpay: goLiveStage.CHOSEN_PSP_SMARTPAY,
  epdq: goLiveStage.CHOSEN_PSP_EPDQ,
  gov_banking: goLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY
}

module.exports = async function submitPspChoice (req, res, next) {
  const psp = req.body[PSP]
  const pspOther = req.body[PSP_OTHER]
  const otherPspSelected = psp === 'other_psp'

  const errors = {}
  if (psp === undefined && pspOther === undefined) {
    errors['choose-how-to-process-payments-mode'] = 'You need to select an option'
  } else if (otherPspSelected && pspOther === undefined) {
    errors['choose-how-to-process-payments-mode-other'] = 'You need to select Worldpay, Smartpay or ePDQ'
  }

  if (lodash.isEmpty(errors)) {
    const chosenStage = (psp && !otherPspSelected) ? psp : pspOther
    const chosenPspStage = stages[chosenStage]
    try {
      const updatedService = await updateCurrentGoLiveStage(req.service.externalId, chosenPspStage)
      res.redirect(
        303,
        formatServicePathsFor(goLiveStageToNextPagePath[updatedService.currentGoLiveStage], req.service.externalId)
      )
    } catch (err) {
      next(err)
    }
  } else {
    return response.response(req, res, 'request-to-go-live/choose-how-to-process-payments', {
      errors,
      otherPspSelected
    })
  }
}
