var logger          = require('winston');
var csrf            = require('csrf');
var response        = require('../utils/response.js').response;
var ERROR_MESSAGE   = require('../utils/response.js').ERROR_MESSAGE;
var renderErrorView = require('../utils/response.js').renderErrorView;
var auth            = require('../services/auth_service.js');
var ConnectorClient         = require('../services/clients/connector_client.js').ConnectorClient;

var connectorClient = function(){
  return new ConnectorClient(process.env.CONNECTOR_URL);
};

const publicAuthClient = require('../services/clients/public_auth_client');

// TODO remove these and make them proper i.e. show update destroy etc
const TOKEN_VIEW = 'token';
const TOKEN_GENERATE_VIEW = 'token_generate';

module.exports.index = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);
  withValidAccountId(req, res, accountId, function (accountId, req, res) {
    publicAuthClient.getActiveTokensForAccount({
        correlationId: req.correlationId,
        accountId: accountId
      })
      .then(publicAuthData => {
        let activeTokens = publicAuthData.tokens || [];
        activeTokens.forEach(function (token) {
          token.csrfToken = csrf().create(req.session.csrfSecret);
        });

        logger.debug('Showing tokens view -', {
          view: 'token'
        });

        response(req, res, TOKEN_VIEW, {
          'active': true,
          'header': "available-tokens",
          'token_state': "active",
          'tokens': activeTokens,
          'tokens_singular': activeTokens.length == 1
        }, true);
      })
      .catch(() => {
        renderErrorView(req, res, ERROR_MESSAGE);
      });
  });
};

module.exports.revoked = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);
  withValidAccountId(req, res, accountId, function (accountId, req, res) {
    publicAuthClient.getRevokedTokensForAccount({
        correlationId: req.correlationId,
        accountId: accountId
      })
      .then(publicAuthData => {
        var revokedTokens = publicAuthData.tokens || [];
        revokedTokens.forEach(function (token) {
          token.csrfToken = csrf().create(req.session.csrfSecret);
        });
        logger.info('Showing tokens view -', {
          view: TOKEN_VIEW
        });
        response(req, res, TOKEN_VIEW, {
          'active': false,
          'header': "revoked-tokens",
          'token_state': "revoked",
          'tokens': revokedTokens,
          'tokens_singular': revokedTokens.length == 1
        }, true);
      })
      .catch((err) => {
        renderErrorView(req, res, ERROR_MESSAGE);
      });
  });
};

module.exports.show = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);
  withValidAccountId(req, res, accountId, function (accountId, req, res) {
    response(req, res, TOKEN_GENERATE_VIEW, {'account_id': accountId}, true);
  });
};

module.exports.create = function (req, res) {
  let accountId = auth.get_gateway_account_id(req);
  let correlationId = req.correlationId;
  let description = req.body.description;

  withValidAccountId(req, res, accountId, function (accountId, req, res) {
    let payload =  {
      'account_id': accountId,
      'description': description,
      'created_by': req.user.email
    };

    publicAuthClient.createTokenForAccount({
        payload: payload,
        accountId: accountId,
        correlationId: correlationId
      })
      .then(publicAuthData => response(req, res, TOKEN_GENERATE_VIEW, {
        token: publicAuthData.token,
        description: description
      }, true))
      .catch((reason) => renderErrorView(req, res, ERROR_MESSAGE));
  });
};

module.exports.update = function (req, res) {
  // this does not need to be explicitly tied down to account_id
  // right now because the UUID space is big enough that no-one
  // will be able to discover other peoples' tokens to change them
  let payload = {
    token_link: req.body.token_link,
    description: req.body.description
  };

  publicAuthClient.updateToken({
      payload: payload,
      correlationId: req.correlationId
    })
    .then(publicAuthData => {
      response(req, res, "includes/_token", {
        'token_link': publicAuthData.token_link,
        'created_by': publicAuthData.created_by,
        'issued_date': publicAuthData.issued_date,
        'last_used': publicAuthData.last_used,
        'description': publicAuthData.description,
        'csrfToken': csrf().create(req.session.csrfSecret)
      }, true);
    })
    .catch((rejection) => {
      let responseCode = 500;
      if (rejection && rejection.response) {
        responseCode = rejection.response.statusCode;
      }
      res.sendStatus(responseCode)
    });
};

module.exports.destroy = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);

  var payload = {
    token_link: req.query.token_link
  };

  publicAuthClient.deleteTokenForAccount({
      accountId: accountId,
      correlationId: req.correlationId,
      payload: payload
    })
    .then(publicAuthData => {
      res.setHeader('Content-Type', 'application/json');
      res.json({
        'revoked': publicAuthData.revoked
      });
    })
    .catch(rejection => {
      let responseCode = 500;
      if (rejection && rejection.response) {
        responseCode = rejection.response.statusCode;
      }
      res.sendStatus(responseCode)
    });
};

function withValidAccountId(req, res, accountId, callback) {
  var connectorUrl = process.env.CONNECTOR_URL + '/v1/api/accounts/{accountId}';
  var url = connectorUrl.replace("{accountId}", accountId);

  logger.debug('Calling connector -', {
    service:'publicAuth',
    method: 'GET',
    url: url
  });
  var startTime = new Date();

  connectorClient().getAccount({
    correlationId: req.correlationId,
    gatewayAccountId: accountId
  }, function (connectorData, connectorResponse) {
    var duration = new Date() - startTime;
    logger.info(`[${req.correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);
    if (connectorResponse.statusCode != 200) {
      renderErrorView(req, res, ERROR_MESSAGE);
      return;
    }
    callback(accountId, req, res);
  }).on('connectorError', function (err) {
    var duration = new Date() - startTime;
    logger.info(`[${req.correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);
    logger.debug('[%s] Calling connector threw exception -', req.correlationId, {
      service:'connector',
      method: 'GET',
      url: connectorUrl
    });
    renderErrorView(req, res, ERROR_MESSAGE);
  });
}
