'use strict'

function checkValidWorldpay3dsFlexCredentialsRequest (opts = {}) {
  return {
    correlationId: opts.correlationId || 'a1',
    gatewayAccountId: opts.gatewayAccountId || 333,
    payload: {
      organisational_unit_id: opts.organisational_unit_id || '5bd9b55e4444761ac0af1c80',
      issuer: opts.issuer || '5bd9e0e4444dce153428c940', // pragma: allowlist secret
      jwt_mac_key: opts.jwt_mac_key || 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
    }
  }
}

function checkValidWorldpay3dsFlexCredentialsResponse (opts = {}) {
  return {
    result: opts.result || 'valid'
  }
}

function checkInvalidWorldpay3dsFlexCredentialsRequest (opts = {}) {
  return {
    correlationId: opts.correlationId || 'a1',
    gatewayAccountId: opts.gatewayAccountId || 333,
    payload: {
      organisational_unit_id: opts.organisational_unit_id || '5bd9b55e4444761ac0af1c81',
      issuer: opts.issuer || '5bd9e0e4444dce153428c941', // pragma: allowlist secret
      jwt_mac_key: opts.jwt_mac_key || 'ffffffff-aaaa-1111-1111-52805d5cd9e1'
    }
  }
}

function checkInvalidWorldpay3dsFlexCredentialsResponse (opts = {}) {
  return {
    result: opts.result || 'invalid'
  }
}

function validUpdateWorldpay3dsCredentialsRequest (opts = {}) {
  return {
    organisational_unit_id: opts.organisational_unit_id || '5bd9b55e4444761ac0af1c80',
    issuer: opts.issuer || '5bd9e0e4444dce153428c940', // pragma: allowlist secret
    jwt_mac_key: opts.jwt_mac_key || 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
  }
}

module.exports = {
  checkValidWorldpay3dsFlexCredentialsRequest,
  checkValidWorldpay3dsFlexCredentialsResponse,
  checkInvalidWorldpay3dsFlexCredentialsRequest,
  checkInvalidWorldpay3dsFlexCredentialsResponse,
  validUpdateWorldpay3dsCredentialsRequest
}
