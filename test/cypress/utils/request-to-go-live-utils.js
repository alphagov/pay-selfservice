'use strict'

const userStubs = require('../stubs/user-stubs')
const gatewayAccountStubs = require('../stubs/gateway-account-stubs')
const serviceStubs = require('../stubs/service-stubs')

const variables = {
  userExternalId: 'userExternalId',
  gatewayAccountId: 42,
  serviceExternalId: 'afe452323dd04d1898672bfaba25e3a6'
}

const buildServiceRoleForGoLiveStage = (goLiveStage) => {
  return {
    service: {
      external_id: variables.serviceExternalId,
      current_go_live_stage: goLiveStage,
      gateway_account_ids: [variables.gatewayAccountId]
    }
  }
}

const buildServiceRoleWithMerchantDetails = (merchantDetails, goLiveStage) => {
  return {
    service: {
      external_id: variables.serviceExternalId,
      gateway_account_ids: [variables.gatewayAccountId],
      merchant_details: merchantDetails,
      current_go_live_stage: goLiveStage
    }
  }
}

const getUserAndGatewayAccountStubs = (serviceRole) => {
  return [
    userStubs.getUserSuccessWithServiceRole({ userExternalId: variables.userExternalId, serviceRole }),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId: variables.gatewayAccountId })
  ]
}

const patchUpdateGoLiveStageSuccessStub = (currentGoLiveStage) => {
  return serviceStubs.patchUpdateServiceGoLiveStageSuccess({
    serviceExternalId: variables.serviceExternalId,
    gatewayAccountId: variables.gatewayAccountId,
    currentGoLiveStage
  })
}

const patchUpdateGoLiveStageErrorStub = (currentGoLiveStage) => {
  return serviceStubs.patchGoLiveStageFailure({
    serviceExternalId: variables.serviceExternalId,
    gatewayAccountId: variables.gatewayAccountId,
    currentGoLiveStage: currentGoLiveStage
  })
}

const patchUpdateServiceSuccessCatchAllStub = (currentGoLiveStage) => {
  return serviceStubs.patchUpdateServiceSuccessCatchAll({
    serviceExternalId: variables.serviceExternalId,
    currentGoLiveStage: currentGoLiveStage
  })
}

const setupGetUserAndGatewayAccountStubs = (serviceRole) => {
  cy.task('setupStubs', getUserAndGatewayAccountStubs(serviceRole))
}

module.exports = {
  variables,
  buildServiceRoleForGoLiveStage,
  buildServiceRoleWithMerchantDetails,
  getUserAndGatewayAccountStubs,
  patchUpdateGoLiveStageSuccessStub,
  patchUpdateGoLiveStageErrorStub,
  patchUpdateServiceSuccessCatchAllStub,
  setupGetUserAndGatewayAccountStubs
}
