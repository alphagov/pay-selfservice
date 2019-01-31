'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { requestToGoLive } = require('../../../paths')
const goLiveStage = require('../../../models/go-live-stage')
const { updateCurrentGoLiveStage } = require('../../../services/service_service')
const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const { renderErrorView } = require('../../../utils/response.js')

const NOT_SELECTED_AGREEMENT_ERROR_MSG = 'You need to accept our legal terms to continue'
const stages = {
  CHOSEN_PSP_STRIPE: goLiveStage.TERMS_AGREED_STRIPE,
  CHOSEN_PSP_WORLDPAY: goLiveStage.TERMS_AGREED_WORLDPAY,
  CHOSEN_PSP_SMARTPAY: goLiveStage.TERMS_AGREED_SMARTPAY,
  CHOSEN_PSP_EPDQ: goLiveStage.TERMS_AGREED_EPDQ
}

module.exports = (req, res) => {
  const agreement = lodash.get(req, 'body.agreement')
  if (agreement !== undefined) {
    updateCurrentGoLiveStage(req.service.externalId, stages[req.service.currentGoLiveStage], req.correlationId)
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
    req.flash('genericError', NOT_SELECTED_AGREEMENT_ERROR_MSG)
    lodash.set(req, 'session.pageData.requestToGoLive.agreement', {
      displayStripeAgreement: (lodash.get(req, 'service.currentGoLiveStage', '') === goLiveStage.CHOSEN_PSP_STRIPE)
    })
    return res.redirect(
      303,
      requestToGoLive.agreement.replace(':externalServiceId', req.service.externalId)
    )
  }
}
