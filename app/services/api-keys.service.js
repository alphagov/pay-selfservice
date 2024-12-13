const publicAuthClient = require('@services/clients/public-auth.client')

/**
 * Gets the list of active api keys for a gateway account
 * @param {string} gatewayAccountId
 * @returns {Promise}
 */
const getActiveKeys = async (gatewayAccountId) => {
  const publicAuthData = await publicAuthClient.getActiveTokensForAccount({
    accountId: gatewayAccountId
  })
  return publicAuthData.tokens
}

module.exports = {
  getActiveKeys
}
