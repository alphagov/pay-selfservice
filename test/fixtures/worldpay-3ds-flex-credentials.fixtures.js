'use strict'

const _ = require('lodash')

const pactBase = require('./pact-base')
const pactRegister = pactBase()

const checkValidWorldpay3dsFlexCredentialsRequest = function checkValidWorldpay3dsFlexCredentialsRequest (opts = {}) {
  const data = {
    correlationId: opts.correlationId || 'a1',
    gatewayAccountId: opts.gatewayAccountId || 333,
    payload: {
      organisational_unit_id: opts.organisational_unit_id || '5bd9b55e4444761ac0af1c80',
      issuer: opts.issuer || '5bd9e0e4444dce153428c940',
      jwt_mac_key: opts.jwt_mac_key || 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
    }
  }

  return {
    getPactified: () => {
      return pactRegister.pactify(data)
    },
    getPlain: () => {
      return _.clone(data)
    }
  }
}

const checkValidWorldpay3dsFlexCredentialsResponse = function checkValidWorldpay3dsFlexCredentialsResponse (opts = {}) {
  const data = {
    result: opts.result || 'valid'
  }

  return {
    getPactified: () => {
      return pactRegister.pactify(data)
    },
    getPlain: () => {
      return _.clone(data)
    }
  }
}

const checkInvalidWorldpay3dsFlexCredentialsRequest = function checkInvalidWorldpay3dsFlexCredentialsRequest (opts = {}) {
  const data = {
    correlationId: opts.correlationId || 'a1',
    gatewayAccountId: opts.gatewayAccountId || 333,
    payload: {
      organisational_unit_id: opts.organisational_unit_id || '5bd9b55e4444761ac0af1c81',
      issuer: opts.issuer || '5bd9e0e4444dce153428c941',
      jwt_mac_key: opts.jwt_mac_key || 'ffffffff-aaaa-1111-1111-52805d5cd9e1'
    }
  }

  return {
    getPactified: () => {
      return pactRegister.pactify(data)
    },
    getPlain: () => {
      return _.clone(data)
    }
  }
}

const checkInvalidWorldpay3dsFlexCredentialsResponse = function checkInvalidWorldpay3dsFlexCredentialsResponse (opts = {}) {
  const data = {
    result: opts.result || 'invalid'
  }

  return {
    getPactified: () => {
      return pactRegister.pactify(data)
    },
    getPlain: () => {
      return _.clone(data)
    }
  }
}

module.exports = {
  checkValidWorldpay3dsFlexCredentialsRequest,
  checkValidWorldpay3dsFlexCredentialsResponse,
  checkInvalidWorldpay3dsFlexCredentialsRequest,
  checkInvalidWorldpay3dsFlexCredentialsResponse
}
