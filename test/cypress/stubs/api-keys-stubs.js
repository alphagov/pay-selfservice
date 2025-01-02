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

/**
 * @param {number} gatewayAccountId
 * @param {string} email
 * @param {string} description
 * @param {string} expectedToken
 */
function createApiKey (gatewayAccountId, email, description, expectedToken) {
  const path = '/v1/frontend/auth'
  return stubBuilder('POST', path, 200, {
    request: {
      account_id: gatewayAccountId,
      created_by: email,
      description,
      token_account_type: 'test',
      token_type: 'CARD',
      type: 'API'
    },
    response: {
      token: expectedToken
    }
  })
}

function changeApiKeyName (tokenLink, description) {
  const path = '/v1/frontend/auth'
  return stubBuilder('PUT', path, 200, {
    request: {
      token_link: tokenLink,
      description
    }
  })
}

module.exports = {
  changeApiKeyName,
  createApiKey,
  getApiKeysForGatewayAccount
}
