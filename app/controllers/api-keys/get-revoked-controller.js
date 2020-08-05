'use strict'

// Local dependencies
const { response, renderErrorView } = require('../../utils/response.js')
const auth = require('../../services/auth.service.js')
const publicAuthClient = require('../../services/clients/public-auth.client')

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  publicAuthClient.getRevokedTokensForAccount({
    correlationId: req.correlationId,
    accountId: accountId
  })
    .then(publicAuthData => {
      const revokedTokens = publicAuthData.tokens || []

      response(req, res, 'api-keys/index', {
        'active': false,
        'header': 'revoked-tokens',
        'token_state': 'revoked',
        'tokens': revokedTokens,
        'tokens_singular': revokedTokens.length === 1
      })
    })
    .catch(() => {
      renderErrorView(req, res)
    })
}
