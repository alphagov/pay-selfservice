'use strict'

const { response } = require('../../utils/response.js')
const publicAuthClient = require('../../services/clients/public-auth.client')

module.exports = async function listActiveApiKeys (req, res, next) {
  const accountId = req.account.gateway_account_id
  try {
    const publicAuthData = await publicAuthClient.getActiveTokensForAccount({
      accountId
    })

    const activeTokens = publicAuthData.tokens || []
    response(req, res, 'api-keys/index', {
      tokens: activeTokens,
      tokens_singular: activeTokens.length === 1
    })
  } catch (err) {
    next(err)
  }
}
