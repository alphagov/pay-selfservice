'use strict'

const path = require('path')
const _ = require('lodash')

const pactBase = require(path.join(__dirname, '/pact-base'))
const pactRegister = pactBase()

const validCreateTokenForGatewayAccountRequest = function validCreateTokenForGatewayAccountRequest (opts = {}) {
  const data = {
    account_id: opts.account_id,
    created_by: opts.created_by || 'foo@example.com',
    type: opts.type || 'PRODUCTS',
    description: opts.description || 'A token'
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

const validCreateTokenForGatewayAccountResponse = function validCreateTokenForGatewayAccountResponse (opts = {}) {
  const data = {
    token: opts.token || 'a-token'
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
  validCreateTokenForGatewayAccountRequest,
  validCreateTokenForGatewayAccountResponse
}
