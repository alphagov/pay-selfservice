'use strict'

const userStubs = require('../utils/user-stubs')
const gatewayAccountStubs = require('./gateway-account-stubs')
const serviceStubs = require('./service-stubs')

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

const buildServiceRoleForGoLiveStageWithMerchantName = (goLiveStage) => {
  return {
    service: {
      external_id: variables.serviceExternalId,
      current_go_live_stage: goLiveStage,
      gateway_account_ids: [variables.gatewayAccountId],
      merchant_details: {
        name: 'Merchant name'
      }
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

const getUserWithModifiedServiceRoleOnNextRequestStub = (serviceRoleBefore, serviceRoleAfter) =>
  [
    userStubs.getUserSuccessRepeatFirstResponseNTimes([
      { userExternalId: variables.userExternalId, serviceRoles: serviceRoleBefore },
      { userExternalId: variables.userExternalId, serviceRoles: serviceRoleAfter }
    ]),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId: variables.gatewayAccountId })
  ]

const patchUpdateGoLiveStageSuccessStub = (currentGoLiveStage) => {
  return serviceStubs.patchUpdateServiceGoLiveStageSuccess({
    serviceExternalId: variables.serviceExternalId,
    gatewayAccountId: variables.gatewayAccountId,
    currentGoLiveStage
  })
}

const patchUpdateGoLiveStageErrorStub = (currentGoLiveStage) => {
  return {
    name: 'patchGoLiveStageFailure',
    opts: {
      external_id: variables.serviceExternalId,
      gateway_account_ids: [variables.gatewayAccountId],
      current_go_live_stage: currentGoLiveStage,
      path: 'current_go_live_stage',
      value: currentGoLiveStage
    }
  }
}

const patchUpdateServiceSuccessCatchAllStub = (currentGoLiveStage) => {
  return {
    name: 'patchUpdateServiceSuccessCatchAll',
    opts: {
      external_id: variables.serviceExternalId,
      current_go_live_stage: currentGoLiveStage
    }
  }
}

const setupGetUserAndGatewayAccountStubs = (serviceRole) => {
  cy.task('setupStubs', getUserAndGatewayAccountStubs(serviceRole))
}

module.exports = {
  variables,
  buildServiceRoleForGoLiveStage,
  buildServiceRoleForGoLiveStageWithMerchantName,
  buildServiceRoleWithMerchantDetails,
  getUserAndGatewayAccountStubs,
  getUserWithModifiedServiceRoleOnNextRequestStub,
  patchUpdateGoLiveStageSuccessStub,
  patchUpdateGoLiveStageErrorStub,
  patchUpdateServiceSuccessCatchAllStub,
  setupGetUserAndGatewayAccountStubs
}
