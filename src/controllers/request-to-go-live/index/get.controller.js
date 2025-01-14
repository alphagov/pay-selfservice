'use strict'

const lodash = require('lodash')

const goLiveStage = require('../../../models/go-live-stage')
const response = require('../../../utils/response')

const {
  NOT_STARTED,
  ENTERED_ORGANISATION_NAME,
  ENTERED_ORGANISATION_ADDRESS,
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_GOV_BANKING_WORLDPAY,
  GOV_BANKING_MOTO_OPTION_COMPLETED,
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_GOV_BANKING_WORLDPAY,
  LIVE,
  DENIED
} = goLiveStage

const live = [
  LIVE
]

const agreedToTerms = [
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_GOV_BANKING_WORLDPAY,
  ...live
]

const chosenHowToProcessPayments = [
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_GOV_BANKING_WORLDPAY,
  GOV_BANKING_MOTO_OPTION_COMPLETED,
  ...agreedToTerms
]

const enteredOrganisationAddress = [
  ENTERED_ORGANISATION_ADDRESS,
  ...chosenHowToProcessPayments
]

const enteredOrganisationName = [
  ENTERED_ORGANISATION_NAME,
  ...enteredOrganisationAddress
]

const startedButStillStepsToComplete = [
  ENTERED_ORGANISATION_NAME,
  ENTERED_ORGANISATION_ADDRESS,
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_GOV_BANKING_WORLDPAY,
  GOV_BANKING_MOTO_OPTION_COMPLETED
]

const showNextSteps = [
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_GOV_BANKING_WORLDPAY
]

const pspIsStripe = [
  CHOSEN_PSP_STRIPE,
  TERMS_AGREED_STRIPE
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
    enteredOrganisationAddress: enteredOrganisationAddress.includes(currentGoLiveStage),
    chosenHowToProcessPayments: chosenHowToProcessPayments.includes(currentGoLiveStage),
    agreedToTerms: agreedToTerms.includes(currentGoLiveStage),
    startedButStillStepsToComplete: startedButStillStepsToComplete.includes(currentGoLiveStage),
    showNextSteps: showNextSteps.includes(currentGoLiveStage),
    denied: currentGoLiveStage === DENIED,
    pspIsStripe: pspIsStripe.includes(currentGoLiveStage),
    takesPaymentsOverPhone: (currentGoLiveStage === TERMS_AGREED_GOV_BANKING_WORLDPAY &&
      req.service.takesPaymentsOverPhone)
  }

  return response.response(req, res, 'request-to-go-live/index', pageData)
}
