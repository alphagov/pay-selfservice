const publicAuthClient = require('@services/clients/public-auth.client')
const { Token } = require('@models/Token.class')

const TOKEN_SOURCE = {
  API: 'API',
  PRODUCTS: 'PRODUCTS',
}

/**
 * @param {GatewayAccount} gatewayAccount
 * @param {string} serviceExternalId
 * @param {string} name
 * @param {string} email - the user email
 * @param {'API' | 'PRODUCTS'} tokenSource - The type of the token (must match one of TOKEN_TYPE values).
 * @returns {Promise<string>} the new api key
 */
const createKey = async (gatewayAccount, serviceExternalId, name, email, tokenSource) => {
  const payload = {
    description: name,
    account_id: gatewayAccount.id,
    created_by: email,
    type: tokenSource,
    token_type: 'CARD',
    token_account_type: gatewayAccount.type,
    service_external_id: serviceExternalId,
    service_mode: gatewayAccount.type,
  }
  const response = await publicAuthClient.createTokenForAccount({ payload })
  return response.token
}

/**
 * Gets the list of revoked api keys for a gateway account
 * @param {string} gatewayAccountId
 * @returns {Promise<[Token]>}
 */
const getRevokedKeys = async (gatewayAccountId) => {
  const response = await publicAuthClient.getRevokedTokensForAccount({ accountId: gatewayAccountId })
  const revokedTokens = response.tokens || []
  return revokedTokens.map((tokenData) => Token.fromJson(tokenData))
}

/**
 * Gets the list of active api keys for a gateway account
 * @param {string} gatewayAccountId
 * @returns {Promise<[Token]>}
 */
const getActiveKeys = async (gatewayAccountId) => {
  const response = await publicAuthClient.getActiveTokensForAccount({
    accountId: gatewayAccountId,
  })
  return response.tokens.map((tokenData) => Token.fromJson(tokenData))
}

/**
 * @param {string} tokenLink
 * @param {string} name The new name/description
 * @return {Promise<void>}
 */
const changeKeyName = async (tokenLink, name) => {
  await publicAuthClient.updateToken({ payload: { token_link: tokenLink, description: name } })
}

/**
 * @param {string} gatewayAccountId
 * @param {string} tokenLink
 * @return {Promise<Token>}
 */
const getKeyByTokenLink = async (gatewayAccountId, tokenLink) => {
  const data = await publicAuthClient.getKeyByTokenLink(gatewayAccountId, tokenLink)
  return Token.fromJson(data)
}

/**
 * @deprecated the endpoint used here violates the HTTP DELETE specification by including a request body
 *
 * @param {string} gatewayAccountId
 * @param {string} tokenLink
 * @return {Promise<*>}
 */
const revokeKey = async (gatewayAccountId, tokenLink) => {
  await publicAuthClient.deleteTokenForAccount({
    accountId: gatewayAccountId,
    payload: { token_link: tokenLink },
  })
}

module.exports = {
  changeKeyName,
  createKey,
  getActiveKeys,
  getKeyByTokenLink,
  getRevokedKeys,
  revokeKey,
  TOKEN_SOURCE,
}
