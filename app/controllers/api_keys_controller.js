var logger = require('winston')
var csrf = require('csrf')
var response = require('../utils/response.js').response
var errorView = require('../utils/response.js').renderErrorView
var auth = require('../services/auth_service.js')
const publicAuthClient = require('../services/clients/public_auth_client')
const {DIRECT_DEBIT_TOKEN_PREFIX} = require('../services/clients/direct_debit_connector_client.js')
// TODO remove these and make them proper i.e. show update destroy etc
const API_KEYS_INDEX = 'tokens'
const API_KEY_GENERATE = 'token_generate'

module.exports.index = function (req, res) {
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

        response(req, res, API_KEYS_INDEX, {
          'active': true,
          'header': 'available-tokens',
          'token_state': 'active',
          'tokens': activeTokens,
          'tokens_singular': activeTokens.length === 1
        })
      })
      .catch(() => {
        errorView(req, res)
      })
}

module.exports.revoked = function (req, res) {
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
          view: API_KEYS_INDEX
        })
        response(req, res, API_KEYS_INDEX, {
          'active': false,
          'header': 'revoked-tokens',
          'token_state': 'revoked',
          'tokens': revokedTokens,
          'tokens_singular': revokedTokens.length === 1
        })
      })
      .catch(() => {
        errorView(req, res)
      })
}

module.exports.show = function (req, res) {
  var accountId = auth.getCurrentGatewayAccountId(req)
  response(req, res, API_KEY_GENERATE, {'account_id': accountId})
}

module.exports.create = function (req, res) {
  // current account id is either external (DIRECT_DEBIT) or internal (CARD) for now
  const currentAccountId = auth.getCurrentGatewayAccountId(req)
  const tokenType = currentAccountId.startsWith(DIRECT_DEBIT_TOKEN_PREFIX) ? 'DIRECT_DEBIT' : 'CARD'
  const correlationId = req.correlationId
  const description = req.body.description
  const payload = {
    'account_id': currentAccountId,
    'description': description,
    'created_by': req.user.email,
    'token_type': tokenType
  }
  publicAuthClient.createTokenForAccount({
    payload: payload,
    accountId: currentAccountId,
    correlationId: correlationId
  })
    .then(publicAuthData => response(req, res, API_KEY_GENERATE, {
      token: publicAuthData.token,
      description: description
    }))
    .catch((reason) => errorView(req, res))
}

module.exports.update = function (req, res) {
  // this does not need to be explicitly tied down to account_id
  // right now because the UUID space is big enough that no-one
  // will be able to discover other peoples' tokens to change them
  let payload = {
    token_link: req.body.token_link,
    description: req.body.description
  }

  publicAuthClient.updateToken({
    payload: payload,
    correlationId: req.correlationId
  })
    .then(publicAuthData => {
      response(req, res, 'includes/_token', {
        token: {
          'token_link': publicAuthData.token_link,
          'created_by': publicAuthData.created_by,
          'issued_date': publicAuthData.issued_date,
          'last_used': publicAuthData.last_used,
          'description': publicAuthData.description,
          'csrfToken': csrf().create(req.session.csrfSecret)
        }
      })
    })
    .catch((rejection) => {
      let responseCode = 500
      if (rejection && rejection.errorCode) {
        responseCode = rejection.errorCode
      }
      res.sendStatus(responseCode)
    })
}

module.exports.destroy = function (req, res) {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const payload = {
    token_link: req.query.token_link
  }

  publicAuthClient.deleteTokenForAccount({
    accountId: accountId,
    correlationId: req.correlationId,
    payload: payload
  })
    .then(publicAuthData => {
      res.setHeader('Content-Type', 'application/json')
      res.json({
        'revoked': publicAuthData.revoked
      })
    })
    .catch(rejection => {
      let responseCode = 500
      if (rejection && rejection.errorCode) {
        responseCode = rejection.errorCode
      }
      res.sendStatus(responseCode)
    })
}
