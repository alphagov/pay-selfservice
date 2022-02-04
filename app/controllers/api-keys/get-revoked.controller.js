'use strict'

const { response } = require('../../utils/response.js')
const publicAuthClient = require('../../services/clients/public-auth.client')

module.exports = async function listRevokedApiKeys (req, res, next) {
  const accountId = req.account.gateway_account_id
  try {
    const publicAuthData = await publicAuthClient.getRevokedTokensForAccount({
      correlationId: req.correlationId,
      accountId: accountId
    })
    const revokedTokens = publicAuthData.tokens || []

    response(req, res, 'api-keys/revoked-keys', {
      tokens: revokedTokens,
      tokens_singular: revokedTokens.length === 1
    })
  } catch (err) {
    next(err)
  }
}
