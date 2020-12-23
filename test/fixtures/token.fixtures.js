'use strict'

function validCreateTokenForGatewayAccountRequest (opts = {}) {
  return {
    account_id: opts.account_id,
    created_by: opts.created_by || 'foo@example.com',
    type: opts.type || 'PRODUCTS',
    description: opts.description || 'A token'
  }
}

function validCreateTokenForGatewayAccountResponse (opts = {}) {
  return {
    token: opts.token || 'a-token'
  }
}

module.exports = {
  validCreateTokenForGatewayAccountRequest,
  validCreateTokenForGatewayAccountResponse
}
