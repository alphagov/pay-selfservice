'use strict'

function validCreateTokenForGatewayAccountResponse (opts = {}) {
  return {
    token: opts.token || 'a-token'
  }
}

function validGetTokensForGatewayAccountResponse () {
  return {tokens: [{
    token_link: '12345678901234567890',
    description: 'my-token-description',
    token_type: 'CARD',
    type: 'API',
    issued_date: "10 Sept 2024 - 11:52",
    last_used: "10 Sept 2024 - 12:52",
    created_by: "user-name"
  }]}
}

function validDeleteTokenByApiTokenRequest (apiToken) {
  return {
    token: apiToken
  }
}

module.exports = {
  validCreateTokenForGatewayAccountResponse,
  validGetTokensForGatewayAccountResponse,
  validDeleteTokenByApiTokenRequest
}
