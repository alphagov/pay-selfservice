'use strict'

const goLiveStage = require('../../models/go-live-stage')
const { requestToGoLive } = require('../../paths').service

const goLiveStageToNextPagePathMap = {}
goLiveStageToNextPagePathMap[goLiveStage.NOT_STARTED] = requestToGoLive.organisationName
goLiveStageToNextPagePathMap[goLiveStage.ENTERED_ORGANISATION_NAME] = requestToGoLive.organisationAddress
goLiveStageToNextPagePathMap[goLiveStage.ENTERED_ORGANISATION_ADDRESS] = requestToGoLive.chooseHowToProcessPayments
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_STRIPE] = requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY] = requestToGoLive.chooseTakesPaymentsOverPhone
goLiveStageToNextPagePathMap[goLiveStage.GOV_BANKING_MOTO_OPTION_COMPLETED] = requestToGoLive.agreement
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_STRIPE] = requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.TERMS_AGREED_GOV_BANKING_WORLDPAY] = requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.DENIED] = requestToGoLive.index
goLiveStageToNextPagePathMap[goLiveStage.LIVE] = requestToGoLive.index

module.exports = goLiveStageToNextPagePathMap
