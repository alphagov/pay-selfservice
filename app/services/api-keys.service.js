const publicAuthClient = require('@services/clients/public-auth.client')
const { Token } = require('@models/Token.class')

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
  getActiveKeys
}
