'use strict'

// Local dependencies
const { response, renderErrorView } = require('../../utils/response.js')
const auth = require('../../services/auth.service.js')
const publicAuthClient = require('../../services/clients/public-auth.client')

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  publicAuthClient.getActiveTokensForAccount({
    correlationId: req.correlationId,
    accountId: accountId
  })
    .then(publicAuthData => {
      const activeTokens = publicAuthData.tokens || []

      response(req, res, 'api-keys/index', {
        'active': true,
        'header': 'available-tokens',
        'token_state': 'active',
        'tokens': activeTokens,
        'tokens_singular': activeTokens.length === 1
      })
    })
    .catch(() => {
      renderErrorView(req, res)
    })
}
