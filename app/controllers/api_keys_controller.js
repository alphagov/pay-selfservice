var logger = require('winston')
var csrf = require('csrf')
var response = require('../utils/response.js').response
var errorView = require('../utils/response.js').renderErrorView
var auth = require('../services/auth_service.js')

const publicAuthClient = require('../services/clients/public_auth_client')

// TODO remove these and make them proper i.e. show update destroy etc
const API_KEYS_INDEX = 'api-keys/index'
const API_KEY_GENERATE = 'api-keys/generate'

module.exports.index = function (req, res) {
  var accountId = auth.getCurrentGatewayAccountId(req)

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
  var accountId = auth.getCurrentGatewayAccountId(req)
  publicAuthClient.getRevokedTokensForAccount({
    correlationId: req.correlationId,
    accountId: accountId
  })
      .then(publicAuthData => {
        var revokedTokens = publicAuthData.tokens || []
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
  let accountId = auth.getCurrentGatewayAccountId(req)
  let correlationId = req.correlationId
  let description = req.body.description

  let payload = {
    'account_id': accountId,
    'description': description,
    'created_by': req.user.email
  }

  publicAuthClient.createTokenForAccount({
    payload: payload,
    accountId: accountId,
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
        'token_link': publicAuthData.token_link,
        'created_by': publicAuthData.created_by,
        'issued_date': publicAuthData.issued_date,
        'last_used': publicAuthData.last_used,
        'description': publicAuthData.description,
        'csrfToken': csrf().create(req.session.csrfSecret)
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
  var accountId = auth.getCurrentGatewayAccountId(req)

  var payload = {
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
