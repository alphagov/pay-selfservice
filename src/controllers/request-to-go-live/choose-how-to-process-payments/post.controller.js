'use strict'

const lodash = require('lodash')

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const { updateCurrentGoLiveStage } = require('../../../services/service.service')
const goLiveStage = require('../../../models/go-live-stage')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')
const response = require('../../../utils/response')

const PSP = 'choose-how-to-process-payments-mode'
const stages = {
  stripe: goLiveStage.CHOSEN_PSP_STRIPE,
  gov_banking: goLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY
}

module.exports = async function submitPspChoice (req, res, next) {
  const psp = req.body[PSP]

  const errors = {}
  if (psp === undefined) {
    errors['choose-how-to-process-payments-mode'] = 'You need to select an option'
  }

  if (lodash.isEmpty(errors)) {
    const chosenPspStage = stages[psp]
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
      errors
    })
  }
}
