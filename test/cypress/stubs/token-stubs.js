'use strict'

const tokenFixtures = require('../../fixtures/token.fixtures')
const { stubBuilder } = require('./stub-builder')

function postCreateTokenForAccountSuccess () {
  const path = '/v1/frontend/auth'
  return stubBuilder('POST', path, 200, {
    response: tokenFixtures.validCreateTokenForGatewayAccountResponse()
  })
}

module.exports = {
  postCreateTokenForAccountSuccess
}
