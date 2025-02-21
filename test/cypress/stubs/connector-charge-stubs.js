const connectorChargeFixtures = require('../../fixtures/connector-charge.fixtures')
const { stubBuilder } = require('./stub-builder')

function postCreateChargeSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gateway_account_id}/charges`
  return stubBuilder('POST', path, 200, {
    response: connectorChargeFixtures.validChargeResponse(opts),
    deepMatchRequest: false
  })
}

function postChargeRequestSuccessByServiceExternalIdAndAccountType (opts) {
  const path = `/v1/api/service/${opts.serviceExternalId}/account/${opts.accountType}/charges`
  return stubBuilder('POST', path, 200, {
    response: connectorChargeFixtures.validChargeResponse(opts),
    deepMatchRequest: false
  })
}

function getChargeSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.chargeExternalId}`
  return stubBuilder('GET', path, 200, {
    response: connectorChargeFixtures.validChargeResponse(opts)
  })
}

function getChargeSuccessByServiceExternalIdAndAccountType (opts) {
  const path = `/v1/api/service/${opts.serviceExternalId}/account/${opts.accountType}/charges/${opts.chargeExternalId}`
  return stubBuilder('GET', path, 200, {
    response: connectorChargeFixtures.validChargeResponse(opts)
  })
}

function postCreateRefundSuccess (gatewayAccountId, chargeId) {
  const path = `/v1/api/accounts/${gatewayAccountId}/charges/${chargeId}/refunds`
  return stubBuilder('POST', path, 200)
}

module.exports = {
  postCreateChargeSuccess,
  postChargeRequestSuccessByServiceExternalIdAndAccountType,
  getChargeSuccess,
  getChargeSuccessByServiceExternalIdAndAccountType,
  postCreateRefundSuccess
}
