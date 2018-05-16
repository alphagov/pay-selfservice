'use strict'

// NPM dependencies
const logger = require('winston')
const csrf = require('csrf')

// Local dependencies
const {response, renderErrorView} = require('../../utils/response.js')
const auth = require('../../services/auth_service.js')
const publicAuthClient = require('../../services/clients/public_auth_client')

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  publicAuthClient.getRevokedTokensForAccount({
    correlationId: req.correlationId,
    accountId: accountId
  })
      .then(publicAuthData => {
        const revokedTokens = publicAuthData.tokens || []
        revokedTokens.forEach(function (token) {
          token.csrfToken = csrf().create(req.session.csrfSecret)
        })
        logger.info('Showing tokens view -', {
          view: 'api-keys/index'
        })
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
