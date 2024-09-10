'use strict'

const tokenFixtures = require('../../fixtures/token.fixtures')
const { stubBuilder } = require('./stub-builder')

function postCreateTokenForAccountSuccess (opts) {
  const path = '/v1/frontend/auth'
  return stubBuilder('POST', path, 200, {
    response: tokenFixtures.validCreateTokenForGatewayAccountResponse(opts)
  })
}

function getTokensForAccountSuccess (gatewayAccountId) {
  const path = `/v1/frontend/auth/${gatewayAccountId}`
  return stubBuilder('GET', path, 200, {
    response: tokenFixtures.validGetTokensForGatewayAccountResponse()
  })
}

function deleteTokenByApiTokenSuccess (gatewayAccountId, apiToken) {
  const path = `/v1/frontend/auth/${gatewayAccountId}`
  return stubBuilder('DELETE', path, 200, {
    request: tokenFixtures.validDeleteTokenByApiTokenRequest(apiToken)
  })
}

function revokeTokensForAccount (gatewayAccountId) {
  const path = `/v1/frontend/auth/${gatewayAccountId}/revoke-all`
  return stubBuilder('DELETE', path, 200)
}

module.exports = {
  postCreateTokenForAccountSuccess,
  getTokensForAccountSuccess,
  deleteTokenByApiTokenSuccess,
  revokeTokensForAccount
}
