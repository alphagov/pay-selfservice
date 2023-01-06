'use strict'

const tokenFixtures = require('../../fixtures/token.fixtures')
const { stubBuilder } = require('./stub-builder')

function postCreateTokenForAccountSuccess (opts) {
  const path = '/v1/frontend/auth'
  return stubBuilder('POST', path, 200, {
    response: tokenFixtures.validCreateTokenForGatewayAccountResponse(opts)
  })
}

function deleteTokenByApiTokenSuccess (gatewayAccountId, apiToken) {
  const path = `/v1/frontend/auth/${gatewayAccountId}`
  return stubBuilder('DELETE', path, 200, {
    request: tokenFixtures.validDeleteTokenByApiTokenRequest(apiToken)
  })
}

module.exports = {
  postCreateTokenForAccountSuccess,
  deleteTokenByApiTokenSuccess
}
