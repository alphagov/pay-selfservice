'use strict'

const serviceFixtures = require('../../fixtures/service.fixtures')
const { stubBuilder } = require('./stub-builder')

function postCreateServiceSuccess (opts) {
  const serviceName = {
    en: opts.serviceName.en
  }
  if (opts.serviceName.cy) {
    serviceName.cy = opts.serviceName.cy
  }

  const fixtureOpts = {
    gateway_account_ids: [opts.gatewayAccountId],
    service_name: serviceName,
    external_id: opts.serviceExternalId
  }
  const path = '/v1/api/services'
  return stubBuilder('POST', path, 200, {
    request: serviceFixtures.validCreateServiceRequest(fixtureOpts),
    response: serviceFixtures.validServiceResponse(fixtureOpts),
    verifyCalledTimes: opts.verifyCalledTimes
  })
}

function patchUpdateServiceNameSuccess (opts) {
  const path = `/v1/api/services/${opts.serviceExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: serviceFixtures.validUpdateServiceNameRequest({
      en: opts.serviceName.en,
      cy: opts.serviceName.cy || ''
    }),
    response: serviceFixtures.validServiceResponse({
      external_id: opts.serviceExternalId
    }),
    verifyCalledTimes: opts.verifyCalledTimes
  })
}
function patchUpdateServiceGoLiveStageSuccess (opts) {
  const path = `/v1/api/services/${opts.serviceExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: serviceFixtures.validUpdateRequestToGoLiveRequest(opts.currentGoLiveStage),
    response: serviceFixtures.validServiceResponse({
      external_id: opts.serviceExternalId,
      current_go_live_stage: opts.currentGoLiveStage,
      gateway_account_ids: [opts.gatewayAccountId]
    })
  })
}

function patchUpdateServicePspTestAccountStage (opts) {
  const path = `/v1/api/services/${opts.serviceExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: serviceFixtures.validUpdatePspTestAccountStage(opts.pspTestAccountStage),
    response: serviceFixtures.validServiceResponse({
      external_id: opts.serviceExternalId,
      current_psp_test_account_stage: opts.pspTestAccountStage,
      gateway_account_ids: [opts.gatewayAccountId]
    })
  })
}

function patchUpdateMerchantDetailsSuccess (opts) {
  const merchantDetails = {
    name: opts.organisationName
  }
  const path = `/v1/api/services/${opts.serviceExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: serviceFixtures.validUpdateMerchantDetailsRequest(merchantDetails),
    response: serviceFixtures.validServiceResponse({
      external_id: opts.serviceExternalId,
      gateway_account_ids: [opts.gatewayAccountId],
      current_go_live_stage: opts.currentGoLiveStage,
      merchant_details: merchantDetails
    })
  })
}

function patchUpdateServiceSuccessCatchAll (opts) {
  const path = `/v1/api/services/${opts.serviceExternalId}`
  return stubBuilder('PATCH', path, 200, {
    response: serviceFixtures.validServiceResponse({
      external_id: opts.serviceExternalId,
      current_go_live_stage: opts.currentGoLiveStage
    })
  })
}

function patchGoLiveStageFailure (opts) {
  const path = `/v1/api/services/${opts.serviceExternalId}`
  return stubBuilder('PATCH', path, 404, {
    request: serviceFixtures.validUpdateServiceRequest({
      path: 'current_go_live_stage',
      value: opts.currentGoLiveStage
    })
  })
}

function patchUpdateServiceGatewayAccounts (opts) {
  const path = `/v1/api/services/${opts.serviceExternalId}`
  return stubBuilder('PATCH', path, 200, {
    response: serviceFixtures.validServiceResponse()
  })
}

function patchUpdateDefaultBillingAddressCountrySuccess (opts) {
  const path = `/v1/api/services/${opts.serviceExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: serviceFixtures.validUpdateDefaultBillingAddressRequest(opts.country),
    response: serviceFixtures.validServiceResponse({
      external_id: opts.serviceExternalId,
      gateway_account_ids: [opts.gatewayAccountId],
      default_billing_address_country: opts.country
    }),
    verifyCalledTimes: opts.verifyCalledTimes
  })
}

module.exports = {
  postCreateServiceSuccess,
  patchUpdateServiceNameSuccess,
  patchUpdateServiceGoLiveStageSuccess,
  patchUpdateMerchantDetailsSuccess,
  patchUpdateServiceSuccessCatchAll,
  patchGoLiveStageFailure,
  patchUpdateServicePspTestAccountStage,
  patchUpdateServiceGatewayAccounts,
  patchUpdateDefaultBillingAddressCountrySuccess
}
