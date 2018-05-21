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
  publicAuthClient.getActiveTokensForAccount({
    correlationId: req.correlationId,
    accountId: accountId
  })
    .then(publicAuthData => {
      let activeTokens = publicAuthData.tokens || []
      activeTokens.forEach(function (token) {
        token.csrfToken = csrf().create(req.session.csrfSecret)
      })

      logger.debug('Showing tokens view -', {
        view: 'token'
      })

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
