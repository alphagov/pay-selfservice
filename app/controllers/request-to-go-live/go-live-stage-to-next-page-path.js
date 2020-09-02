'use strict'

const goLiveStage = require('../../models/go-live-stage')
const { requestToGoLive } = require('../../paths')

const goLiveStageToNextPagePathMap = {}
goLiveStageToNextPagePathMap[goLiveStage.NOT_STARTED] = requestToGoLive.organisationName
goLiveStageToNextPagePathMap[goLiveStage.ENTERED_ORGANISATION_NAME] = requestToGoLive.organisationAddress
goLiveStageToNextPagePathMap[goLiveStage.ENTERED_ORGANISATION_ADDRESS] = requestToGoLive.chooseHowToProcessPayments
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_STRIPE] = requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_WORLDPAY] = requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_SMARTPAY] = requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_EPDQ] = requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY] = requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_STRIPE] = requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_WORLDPAY] = requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_SMARTPAY] = requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_EPDQ] = requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_GOV_BANKING_WORLDPAY] = requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.DENIED] = requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.LIVE] = requestToGoLive.index

module.exports = goLiveStageToNextPagePathMap
