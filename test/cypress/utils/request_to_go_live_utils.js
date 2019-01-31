'use strict'

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

const simpleStub = (serviceRole) => {
  return [
    {
      name: 'getUserSuccess',
      opts: {
        external_id: variables.userExternalId,
        service_roles: [serviceRole]
      }
    },
    {
      name: 'getGatewayAccountSuccess',
      opts: { gateway_account_id: variables.gatewayAccountId }
    }
  ]
}

const stubWithGoLiveStage = (currentGoLiveStage) => {
  return {
    name: 'patchGoLiveStageSuccess',
    opts: {
      external_id: variables.serviceExternalId,
      gateway_account_ids: [variables.gatewayAccountId],
      current_go_live_stage: currentGoLiveStage,
      path: 'current_go_live_stage',
      value: currentGoLiveStage
    }
  }
}

const stubGoLiveStageError = (currentGoLiveStage) => {
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

const setupStubs = (serviceRole) => {
  cy.task('setupStubs', simpleStub(serviceRole))
}

module.exports = {
  variables,
  buildServiceRoleForGoLiveStage,
  simpleStub,
  stubWithGoLiveStage,
  stubGoLiveStageError,
  setupStubs
}
