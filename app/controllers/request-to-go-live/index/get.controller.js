'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const goLiveStage = require('../../../models/go-live-stage')
const response = require('../../../utils/response')

const {
  NOT_STARTED,
  ENTERED_ORGANISATION_NAME,
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_WORLDPAY,
  CHOSEN_PSP_SMARTPAY,
  CHOSEN_PSP_EPDQ,
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_WORLDPAY,
  TERMS_AGREED_SMARTPAY,
  TERMS_AGREED_EPDQ,
  LIVE,
  DENIED
} = goLiveStage

const live = [
  LIVE
]

const agreedToTerms = [
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_WORLDPAY,
  TERMS_AGREED_SMARTPAY,
  TERMS_AGREED_EPDQ
].concat(live)

const chosenHowToProcessPayments = [
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_WORLDPAY,
  CHOSEN_PSP_SMARTPAY,
  CHOSEN_PSP_EPDQ
].concat(agreedToTerms)

const enteredOrganisationName = [
  ENTERED_ORGANISATION_NAME
].concat(chosenHowToProcessPayments)

const startedButStillStepsToComplete = [
  ENTERED_ORGANISATION_NAME,
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_WORLDPAY,
  CHOSEN_PSP_SMARTPAY,
  CHOSEN_PSP_EPDQ
]

const showNextSteps = [
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_WORLDPAY,
  TERMS_AGREED_SMARTPAY,
  TERMS_AGREED_EPDQ
]

module.exports = (req, res) => {
  const currentGoLiveStage = lodash.get(req, 'service.currentGoLiveStage', '')

  let pageData = lodash.get(req, 'session.pageData.requestToGoLive.index')
  if (pageData) {
    delete req.session.pageData.requestToGoLive.index
  }

  pageData = {
    notStarted: currentGoLiveStage === NOT_STARTED,
    enteredOrganisationName: enteredOrganisationName.includes(currentGoLiveStage),
    chosenHowToProcessPayments: chosenHowToProcessPayments.includes(currentGoLiveStage),
    agreedToTerms: agreedToTerms.includes(currentGoLiveStage),
    startedButStillStepsToComplete: startedButStillStepsToComplete.includes(currentGoLiveStage),
    showNextSteps: showNextSteps.includes(currentGoLiveStage),
    denied: currentGoLiveStage === DENIED
  }

  return response.response(req, res,'request-to-go-live/index', pageData)

}
