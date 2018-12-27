'use strict'

// Local dependencies
const goLiveStage = require('../../models/go-live-stage')
const paths = require('../../paths')

const goLiveStageToNextPagePathMap = {}
goLiveStageToNextPagePathMap[goLiveStage.NOT_STARTED] = paths.requestToGoLive.organisationName
goLiveStageToNextPagePathMap[goLiveStage.ENTERED_ORGANISATION_NAME] = paths.requestToGoLive.chooseHowToProcessPayments
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_STRIPE] = paths.requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_WORLDPAY] = paths.requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_SMARTPAY] = paths.requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_EPDQ] = paths.requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_STRIPE] = paths.requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_WORLDPAY] = paths.requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_SMARTPAY] = paths.requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_EPDQ] = paths.requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.DENIED] = paths.requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.LIVE] = paths.requestToGoLive.index

module.exports = goLiveStageToNextPagePathMap
