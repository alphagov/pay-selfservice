function postCreateServiceSuccess (opts) {
  const serviceName = {
    en: opts.serviceName.en
  }
  if (opts.serviceName.cy) {
    serviceName.cy = opts.serviceName.cy
  }

  return {
    name: 'postCreateServiceSuccess',
    opts: {
      gateway_account_ids: [opts.gatewayAccountId],
      service_name: serviceName,
      external_id: opts.serviceExternalId,
      verifyCalledTimes: 1
    }
  }
}

const patchUpdateServiceNameSuccess = function (opts) {
  return {
    name: 'patchUpdateServiceNameSuccess',
    opts: {
      external_id: opts.serviceExternalId,
      serviceName: {
        en: opts.serviceName.en,
        cy: opts.serviceName.cy || ''
      },
      verifyCalledTimes: 1
    }
  }
}
const patchUpdateServiceGoLiveStageSuccess = function (opts) {
  return {
    name: 'patchUpdateServiceGoLiveStageSuccess',
    opts: {
      external_id: opts.serviceExternalId,
      gateway_account_ids: [opts.gatewayAccountId],
      current_go_live_stage: opts.currentGoLiveStage,
      path: 'current_go_live_stage',
      value: opts.currentGoLiveStage
    }
  }
}

const patchUpdateMerchantDetailsSuccess = function (opts) {
  return {
    name: 'patchUpdateMerchantDetailsSuccess',
    opts: {
      external_id: opts.serviceExternalId,
      gateway_account_ids: [opts.gatewayAccountId],
      current_go_live_stage: opts.currentGoLiveStage,
      merchant_details: {
        name: opts.organisationName
      }
    }
  }
}

module.exports = {
  postCreateServiceSuccess,
  patchUpdateServiceNameSuccess,
  patchUpdateServiceGoLiveStageSuccess,
  patchUpdateMerchantDetailsSuccess
}
