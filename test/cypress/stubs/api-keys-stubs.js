const { stubBuilder } = require('@test/cypress/stubs/stub-builder')

/**
 * @param {number} gatewayAccountId
 * @param {[Token]} tokens
 */
function getActiveApiKeysForGatewayAccount (gatewayAccountId, tokens = []) {
  const path = `/v1/frontend/auth/${gatewayAccountId}`
  return stubBuilder('GET', path, 200, {
    response: {
      tokens: tokens.map(t => t.toJson())
    },
    query: {}
  })
}

/**
 * @param {number} gatewayAccountId
 * @param {[Token]} tokens
 */
function getRevokedApiKeysForGatewayAccount (gatewayAccountId, tokens = []) {
  const path = `/v1/frontend/auth/${gatewayAccountId}`
  return stubBuilder('GET', path, 200, {
    response: {
      tokens: tokens.map(t => t.toJson())
    },
    query: {
      state: 'revoked'
    }
  })
}

/**
 * @param {number} gatewayAccountId
 * @param {string} email
 * @param {string} description
 * @param {string} expectedToken
 * @param {object} options
 */
function createApiKey (gatewayAccountId, email, description, expectedToken, options = {}) {
  const path = '/v1/frontend/auth'
  return stubBuilder('POST', path, 200, {
    request: {
      account_id: gatewayAccountId,
      created_by: email,
      description,
      token_account_type: options.tokenAccountType,
      token_type: options.tokenType,
      type: options.type || 'API',
      service_mode: options.serviceMode || 'test',
      service_external_id: options.serviceExternalId
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

function getKeyByTokenLink (gatewayAccountId, tokenLink, description) {
  const path = `/v1/frontend/auth/${gatewayAccountId}/${tokenLink}`
  return stubBuilder('GET', path, 200, {
    response: {
      description
    }
  })
}

function revokeKey (gatewayAccountId, tokenLink) {
  const path = `/v1/frontend/auth/${gatewayAccountId}`
  return stubBuilder('DELETE', path, 200, {
    request: {
      token_link: tokenLink
    }
  })
}

module.exports = {
  changeApiKeyName,
  createApiKey,
  getActiveApiKeysForGatewayAccount,
  getKeyByTokenLink,
  getRevokedApiKeysForGatewayAccount,
  revokeKey
}
