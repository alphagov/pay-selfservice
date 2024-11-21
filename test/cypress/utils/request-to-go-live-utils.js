'use strict'

const userStubs = require('@cypress-stubs/user-stubs')
const gatewayAccountStubs = require('@cypress-stubs/gateway-account-stubs')
const serviceStubs = require('@cypress-stubs/service-stubs')

const variables = {
  userExternalId: 'userExternalId',
  gatewayAccountId: '42',
  gatewayAccountExternalId: 'a-gateway-account-external-id',
  serviceExternalId: 'afe452323dd04d1898672bfaba25e3a6'
}

function buildServiceRoleForGoLiveStage (goLiveStage) {
  return {
    service: {
      external_id: variables.serviceExternalId,
      current_go_live_stage: goLiveStage,
      gateway_account_ids: [variables.gatewayAccountId]
    }
  }
}

function buildServiceRoleWithMerchantDetails (merchantDetails, goLiveStage) {
  return {
    service: {
      external_id: variables.serviceExternalId,
      gateway_account_ids: [variables.gatewayAccountId],
      merchant_details: merchantDetails,
      current_go_live_stage: goLiveStage
    }
  }
}

function getUserAndGatewayAccountStubs (serviceRole) {
  return [
    userStubs.getUserSuccessWithServiceRole({ userExternalId: variables.userExternalId, serviceRole }),
    gatewayAccountStubs.getGatewayAccountSuccess({
      gatewayAccountId: variables.gatewayAccountId,
      gatewayAccountExternalId: variables.gatewayAccountExternalId
    })
  ]
}

function getUserAndGatewayAccountsStubs (serviceRole) {
  return [
    userStubs.getUserSuccessWithServiceRole({ userExternalId: variables.userExternalId, serviceRole }),
    gatewayAccountStubs.getGatewayAccountSuccess({
      gatewayAccountId: variables.gatewayAccountId,
      gatewayAccountExternalId: variables.gatewayAccountExternalId
    })
  ]
}

function getUserAndGatewayAccountByExternalIdStubs (serviceRole, paymentProvider, accountType) {
  return [
    userStubs.getUserSuccessWithServiceRole({ userExternalId: variables.userExternalId, serviceRole }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId: variables.gatewayAccountId,
      gatewayAccountExternalId: variables.gatewayAccountExternalId
    }),
    gatewayAccountStubs.getGatewayAccountsSuccess(
      {
        gatewayAccountId: variables.gatewayAccountId,
        paymentProvider: paymentProvider || 'sandbox',
        type: accountType || 'test'
      })
  ]
}

function patchUpdateGoLiveStageSuccessStub (currentGoLiveStage) {
  return serviceStubs.patchUpdateServiceGoLiveStageSuccess({
    serviceExternalId: variables.serviceExternalId,
    gatewayAccountId: variables.gatewayAccountId,
    currentGoLiveStage
  })
}

function patchUpdateGoLiveStageErrorStub (currentGoLiveStage) {
  return serviceStubs.patchGoLiveStageFailure({
    serviceExternalId: variables.serviceExternalId,
    gatewayAccountId: variables.gatewayAccountId,
    currentGoLiveStage
  })
}

function patchUpdateServiceSuccessCatchAllStub (currentGoLiveStage) {
  return serviceStubs.patchUpdateServiceSuccessCatchAll({
    serviceExternalId: variables.serviceExternalId,
    currentGoLiveStage
  })
}

function setupGetUserAndGatewayAccountStubs (serviceRole) {
  cy.task('setupStubs', getUserAndGatewayAccountStubs(serviceRole))
}

function setupGetUserAndGatewayAccountsStubs (serviceRole) {
  cy.task('setupStubs', getUserAndGatewayAccountsStubs(serviceRole))
}

function setupGetUserAndGatewayAccountByExternalIdStubs (serviceRole) {
  cy.task('setupStubs', getUserAndGatewayAccountByExternalIdStubs(serviceRole))
}

module.exports = {
  variables,
  buildServiceRoleForGoLiveStage,
  buildServiceRoleWithMerchantDetails,
  getUserAndGatewayAccountStubs,
  getUserAndGatewayAccountByExternalIdStubs,
  patchUpdateGoLiveStageSuccessStub,
  patchUpdateGoLiveStageErrorStub,
  patchUpdateServiceSuccessCatchAllStub,
  setupGetUserAndGatewayAccountStubs,
  setupGetUserAndGatewayAccountsStubs,
  setupGetUserAndGatewayAccountByExternalIdStubs
}
