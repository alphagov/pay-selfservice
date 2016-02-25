var logger          = require('winston');
var response        = require('../utils/response.js').response;
var ERROR_MESSAGE   = require('../utils/response.js').ERROR_MESSAGE;
var renderErrorView = require('../utils/response.js').renderErrorView;
var auth            = require('../services/auth_service.js');
var router          = require('../routes.js');
var nodeClientInstance = require('../services/client_factory.js').nodeClientInstance;
var client             = nodeClientInstance();
// TODO remove these and make them proper i.e. show update destroy etc
var TOKEN_VIEW      = 'token';
var TOKEN_GENERATE_VIEW = 'token_generate';


module.exports.index = function(req, res) {
  logger.info('GET ' + router.paths.devTokens.index);
  var accountId = auth.get_account_id(req);

  withValidAccountId(req, res, accountId, function(accountId, req, res) {
    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
    client.get(publicAuthUrl + "/" + accountId, function (publicAuthData, publicAuthResponse) {
      var tokens = publicAuthData.tokens || [],
          activeTokens = [],
          revokedTokens = [];

      tokens.forEach(function(token) {
        token.revoked ? revokedTokens.push(token) : activeTokens.push(token);
      });

      responsePayload = {
        'active_tokens': activeTokens,
        'active_tokens_singular': activeTokens.length == 1,
        'revoked_tokens': revokedTokens,
      };

      response(req.headers.accept, res, TOKEN_VIEW, responsePayload);
    }).on('error', function (err) {
      logger.error('Exception raised calling publicauth:' + err);
      renderErrorView(req, res, ERROR_MESSAGE);
    });

  });
}

module.exports.show = function(req, res) {
  logger.info('GET ' + router.paths.devTokens.show);
  var accountId = auth.get_account_id(req);

  withValidAccountId(req, res, accountId, function(accountId, req, res) {
    responsePayload = {'account_id': accountId};
    var tokenInSession = req.selfservice_state.token;
    if (tokenInSession) {
      responsePayload.token = tokenInSession;
      responsePayload.description = req.selfservice_state.description;
      delete req.selfservice_state.token;
      delete req.selfservice_state.description;
    }

    response(req.headers.accept, res, TOKEN_GENERATE_VIEW, responsePayload);
  });
}

module.exports.create = function(req, res) {
  logger.info('POST ' + router.paths.devTokens.create);
  var accountId = auth.get_account_id(req);

  if (req.selfservice_state.token) {
    delete req.selfservice_state.token;
    delete req.selfservice_state.description;
    renderErrorView(req, res, ERROR_MESSAGE);
    return;
  }

  withValidAccountId(req, res, accountId, function(accountId, req, res) {
    var description = req.body.description;
    var payload = {
      headers: {"Content-Type": "application/json"},
      data: {
        'account_id': accountId,
        'description': description
      }
    };

    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
    client.post(publicAuthUrl, payload, function (publicAuthData, publicAuthResponse) {

      if (publicAuthResponse.statusCode === 200) {
        req.selfservice_state.token = publicAuthData.token;
        req.selfservice_state.description = description;
        res.redirect(303, router.paths.devTokens.show);
        return;
      }
      renderErrorView(req, res, 'Error creating dev token for account ' + accountId);

    }).on('error', function (err) {
      logger.error('Exception raised calling publicauth:' + err);
      renderErrorView(req, res, ERROR_MESSAGE);
    });

  });
}

module.exports.update = function(req, res) {
    logger.info('PUT ' + router.paths.devTokens.index);

    // this does not need to be explicitly tied down to account_id
    // right now because the UUID space is big enough that no-one
    // will be able to discover other peoples' tokens to change them

    var requestPayload = {
      headers:{"Content-Type": "application/json"},
      data: {
        token_link: req.body.token_link,
        description: req.body.description
      }
    };

    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
    client.put(publicAuthUrl, requestPayload, function (publicAuthData, publicAuthResponse) {
      var responseStatusCode = publicAuthResponse.statusCode;
      if (responseStatusCode != 200) {
        res.sendStatus(responseStatusCode);
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.json({
        'token_link': publicAuthData.token_link,
        'description': publicAuthData.description
      });
    }).on('error', function (err) {
      logger.error('Exception raised calling publicauth:' + err);
      res.sendStatus(500);
    });
}

module.exports.destroy = function(req, res) {
    logger.info('DELETE ' + router.paths.devTokens.index);

    var accountId = auth.get_account_id(req);

    var requestPayload = {
      headers:{"Content-Type": "application/json"},
      data: {
        token_link: req.query.token_link
      }
    };

    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
    client.delete(publicAuthUrl + "/" + accountId, requestPayload, function (publicAuthData, publicAuthResponse) {
      var responseStatusCode = publicAuthResponse.statusCode;
      if (responseStatusCode != 200) {
        res.sendStatus(responseStatusCode);
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.json({
        'revoked': publicAuthData.revoked
      });
    }).on('error', function (err) {
      logger.error('Exception raised calling publicauth:' + err);
      res.sendStatus(500);
    });
}

function withValidAccountId(req, res, accountId, callback) {
  var connectorUrl = process.env.CONNECTOR_URL + '/v1/api/accounts/{accountId}';
  client.get(connectorUrl.replace("{accountId}",accountId), function (connectorData, connectorResponse) {
    if (connectorResponse.statusCode != 200) {
      renderErrorView(req, res, ERROR_MESSAGE);
      return;
    }
    callback(accountId, req, res);
  }).on('error', function (err) {
    logger.error('Exception raised calling connector:' + err);
    renderErrorView(req, res, ERROR_MESSAGE);
  });
}


module.exports.bindRoutesTo = function (app) {
}
