var logger = require('winston');
var csrf = require('csrf');
var response = require('../utils/response.js').response;
var ERROR_MESSAGE = require('../utils/response.js').ERROR_MESSAGE;
var renderErrorView = require('../utils/response.js').renderErrorView;
var Client = require('node-rest-client').Client;
var client = new Client();
var auth = require('../services/auth_service.js');

// TODO remove these and make them proper i.e. show update destroy etc
var TOKEN_VIEW = 'token';
var TOKEN_GENERATE_VIEW = 'token_generate';

module.exports.index = function (req, res) {

  var accountId = auth.get_gateway_account_id(req);

  withValidAccountId(req, res, accountId, function (accountId, req, res) {
    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;

    logger.info('Calling publicAuth to get tokens -', {
      service: 'publicAuth',
      method: 'GET',
      url: publicAuthUrl + '/{accountId}'
    });

    client.get(publicAuthUrl + "/" + accountId, function (publicAuthData) {
      var tokens = publicAuthData.tokens || [],
        activeTokens = [],
        revokedTokens = [];

      tokens.forEach(function (token) {
        token.csrfToken = csrf().create(req.session.csrfSecret);
        token.revoked ? revokedTokens.push(token) : activeTokens.push(token);
      });
      responsePayload = {
        'active_tokens': activeTokens,
        'active_tokens_singular': activeTokens.length == 1,
        'revoked_tokens': revokedTokens
      };

      logger.info('Showing tokens view -', {
        view: 'token'
      });
      response(req.headers.accept, res, TOKEN_VIEW, responsePayload);
    }).on('error', function (err) {
      logger.error('Calling publicAuth to get tokens threw exception -', {
        service: 'publicAuth',
        method: 'GET',
        url: publicAuthUrl + '/{accountId}',
        err: err
      });
      renderErrorView(req, res, ERROR_MESSAGE);
    });

  });
};

module.exports.show = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);
  withValidAccountId(req, res, accountId, function (accountId, req, res) {
    response(req.headers.accept, res, TOKEN_GENERATE_VIEW, {'account_id': accountId});
  });
};

module.exports.create = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);

  withValidAccountId(req, res, accountId, function (accountId, req, res) {
    var description = req.body.description;
    var payload = {
      headers: {"Content-Type": "application/json"},
      data: {
        'account_id': accountId,
        'description': description,
        'created_by': req.user.email
      }
    };

    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;

    logger.info('Calling publicAuth to create a dev token -', {
      service: 'publicAuth',
      method: 'POST',
      url: publicAuthUrl
    });
    client.post(publicAuthUrl, payload, function (publicAuthData, publicAuthResponse) {
      if (publicAuthResponse.statusCode !== 200) {
        return renderErrorView(req, res, 'Error creating dev token for account');
      }

      response(req.headers.accept, res, TOKEN_GENERATE_VIEW, {
        token: publicAuthData.token,
        description: description
      });

    }).on('error', function (err) {
      logger.error('Calling publicAuth threw exception -', {
        service: 'publicAuth',
        method: 'POST',
        url: publicAuthUrl,
        error: err
      });
      renderErrorView(req, res, ERROR_MESSAGE);
    });

  });
};

module.exports.update = function (req, res) {
  // this does not need to be explicitly tied down to account_id
  // right now because the UUID space is big enough that no-one
  // will be able to discover other peoples' tokens to change them
  var requestPayload = {
    headers: {"Content-Type": "application/json"},
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
    response(req.headers.accept, res, "includes/_token", {
      'token_link': publicAuthData.token_link,
      'description': publicAuthData.description,
      'csrfToken': csrf().create(req.session.csrfSecret)
    });

  }).on('error', function (err) {
    logger.error('Calling publicAuth threw exception -', {
      service: 'publicAuth',
      method: 'POST',
      url: publicAuthUrl,
      error: err
    });
    res.sendStatus(500);
  });
};

module.exports.destroy = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);
  var publicAuthUrl = process.env.PUBLIC_AUTH_URL + '/{accountId}';

  var requestPayload = {
    headers: {"Content-Type": "application/json"},
    data: {
      token_link: req.query.token_link
    }
  };

  logger.info('Calling public auth -', {
    service: 'publicAuth',
    method: 'DELETE',
    url: publicAuthUrl
  });
  client.delete(publicAuthUrl.replace('{accountId}', accountId), requestPayload, function (publicAuthData, publicAuthResponse) {
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
    logger.error('Calling publicAuth threw exception -', {
      service: 'publicAuth',
      method: 'DELETE',
      url: publicAuthUrl,
      error: err
    });
    res.sendStatus(500);
  });
};

function withValidAccountId(req, res, accountId, callback) {
  var connectorUrl = process.env.CONNECTOR_URL + '/v1/api/accounts/{accountId}';
  logger.info('Calling connector -', {
    service: 'publicAuth',
    method: 'GET',
    url: connectorUrl
  });
  client.get(connectorUrl.replace("{accountId}", accountId), function (connectorData, connectorResponse) {
    if (connectorResponse.statusCode != 200) {
      renderErrorView(req, res, ERROR_MESSAGE);
      return;
    }
    callback(accountId, req, res);
  }).on('error', function (err) {
    logger.info('Calling connector threw exception -', {
      service: 'connector',
      method: 'GET',
      url: connectorUrl
    });
    renderErrorView(req, res, ERROR_MESSAGE);
  });
}
