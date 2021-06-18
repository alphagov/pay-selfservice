const connectorChargeFixtures = require('../../fixtures/connector-charge.fixtures')
const { stubBuilder } = require('./stub-builder')

function postCreateChargeSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gateway_account_id}/charges`
  return stubBuilder('POST', path, 200, {
    response: connectorChargeFixtures.validChargeResponse(opts)
  })
}

function getChargeSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.charge_id}`
  return stubBuilder('GET', path, 200, {
    response: connectorChargeFixtures.validChargeResponse(opts)
  })
}

module.exports = { postCreateChargeSuccess, getChargeSuccess }
