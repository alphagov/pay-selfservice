const publicAuthClient = require('@services/clients/public-auth.client')
const { Token } = require('@models/Token.class')

const TOKEN_SOURCE = {
  API: 'API',
  PRODUCTS: 'PRODUCTS'
}

/**
 * @param {GatewayAccount} gatewayAccount
 * @param {string} description
 * @param {string} email - the user email
 * @param {'API' | 'PRODUCTS'} tokenSource - The type of the token (must match one of TOKEN_TYPE values).
 * @returns {Promise<string>} the new api key
 */
const createApiKey = async (gatewayAccount, description, email, tokenSource) => {
  const payload = {
    description,
    account_id: gatewayAccount.id,
    created_by: email,
    type: tokenSource,
    token_type: 'CARD',
    token_account_type: gatewayAccount.type
  }
  const response = await publicAuthClient.createTokenForAccount({ payload })
  return response.token
}

/**
 * Gets the list of active api keys for a gateway account
 * @param {string} gatewayAccountId
 * @returns {[Token]}
 */
const getActiveKeys = async (gatewayAccountId) => {
  const publicAuthData = await publicAuthClient.getActiveTokensForAccount({
    accountId: gatewayAccountId
  })
  return publicAuthData.tokens.map(tokenData => Token.fromJson(tokenData))
}

module.exports = {
  createApiKey,
  getActiveKeys,
  TOKEN_SOURCE
}
