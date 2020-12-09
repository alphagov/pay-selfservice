'use strict'

const path = require('path')
const _ = require('lodash')

const pactBase = require(path.join(__dirname, '/pact-base'))
const pactRegister = pactBase()

const checkValidWorldpay3dsFlexCredentialsRequest = function checkValidWorldpay3dsFlexCredentialsRequest (opts = {}) {
  const data = {
    correlationId: opts.correlationId || 'a1',
    gatewayAccountId: opts.gatewayAccountId || 333,
    payload: {
      organisational_unit_id: opts.organisationalUnitId || '5bd9b55e4444761ac0af1c80',
      issuer: opts.issuer || '5bd9e0e4444dce153428c940',
      jwt_mac_key: opts.jwtMacKey || 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
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

module.exports = {
  checkValidWorldpay3dsFlexCredentialsRequest,
  checkValidWorldpay3dsFlexCredentialsResponse
}
