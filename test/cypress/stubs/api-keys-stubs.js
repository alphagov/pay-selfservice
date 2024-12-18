const { stubBuilder } = require('@test/cypress/stubs/stub-builder')

/**
 * @param {number} gatewayAccountId
 * @param {[Token]} tokens
 */
function getApiKeysForGatewayAccount (gatewayAccountId, tokens = []) {
  const path = `/v1/frontend/auth/${gatewayAccountId}`
  return stubBuilder('GET', path, 200, {
    response: {
      tokens: tokens.map(t => t.toJson())
    }
  })
}

module.exports = {
  getApiKeysForGatewayAccount
}
