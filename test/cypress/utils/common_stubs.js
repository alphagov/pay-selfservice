'use strict'

module.exports.getUserStub = (userExternalId, gatewayAccountIds, serviceExternalId = 'a-service-id', goLiveStage = 'NOT_STARTED') => {
  return {
    name: 'getUserSuccess',
    opts: {
      external_id: userExternalId,
      service_roles: [{
        service: {
          gateway_account_ids: gatewayAccountIds,
          current_go_live_stage: goLiveStage
        }
      }]
    }
  }
}

module.exports.getGatewayAccountStub = (gatewayAccountId, type = 'test', paymentProvider = 'sandbox') => {
  return {
    name: 'getGatewayAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      type: type,
      payment_provider: paymentProvider
    }
  }
}

module.exports.getDirectDebitGatewayAccountStub = (gatewayAccountId, type = 'test', paymentProvider = 'sandbox') => {
  return {
    name: 'getDirectDebitGatewayAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      type: type,
      payment_provider: paymentProvider
    }
  }
}
