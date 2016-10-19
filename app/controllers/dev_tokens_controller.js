var logger          = require('winston');
var csrf            = require('csrf');
var response        = require('../utils/response.js').response;
var ERROR_MESSAGE   = require('../utils/response.js').ERROR_MESSAGE;
var renderErrorView = require('../utils/response.js').renderErrorView;
var Client          = require('node-rest-client').Client;
var client          = new Client();
var auth            = require('../services/auth_service.js');
var CORRELATION_HEADER    = require('../utils/correlation_header.js').CORRELATION_HEADER;
var withCorrelationHeader = require('../utils/correlation_header.js').withCorrelationHeader;

// TODO remove these and make them proper i.e. show update destroy etc
var TOKEN_VIEW = 'token';
var TOKEN_GENERATE_VIEW = 'token_generate';

module.exports.index = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);
  withValidAccountId(req, res, accountId, function (accountId, req, res) {
    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
    var url = publicAuthUrl + "/" + accountId;

    var correlationId = req.headers[CORRELATION_HEADER] || '';
    var args = {};
    // MOVE DOWN TO THE MDOEL LEVEL

    logger.debug('Calling publicAuth to get active tokens -', {
      service: 'publicAuth',
      method: 'GET',
      url: url
    });

    var startTime = new Date();
    client.get(url, withCorrelationHeader(args, correlationId), function (publicAuthData) {
      var activeTokens = publicAuthData.tokens || [];
      activeTokens.forEach(function (token) {
        token.csrfToken = csrf().create(req.session.csrfSecret);
      });
      logger.debug('Showing tokens view -', {
        view: 'token'
      });
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);

      response(req.headers.accept, res, TOKEN_VIEW, {
        'active': true,
        'header': "available-tokens",
        'token_state': "active",
        'tokens': activeTokens,
        'tokens_singular': activeTokens.length == 1
      });
    }).on('error', function (err) {
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);
      logger.error('[%s] Calling publicAuth to get active tokens threw exception -', correlationId, {
        service: 'publicAuth',
        method: 'GET',
        url: url,
        err: err
      });
      renderErrorView(req, res, ERROR_MESSAGE);
    });
    // END OF MOVE DOWN TO MODEL LEVEL

  });
};

module.exports.revoked = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);
  withValidAccountId(req, res, accountId, function (accountId, req, res) {
    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
    var url = publicAuthUrl + "/" + accountId + "?state=revoked";

    var correlationId = req.headers[CORRELATION_HEADER] || '';
    var args = {};
    // MOVE DOWN TO MDOEL LEVEL
    logger.debug('[%s] Calling publicAuth to get revoked tokens -', correlationId, {
      service: 'publicAuth',
      method: 'GET',
      url: url
    });

    client.get(url, withCorrelationHeader(args, correlationId), function (publicAuthData) {
      var revokedTokens = publicAuthData.tokens || [];
      revokedTokens.forEach(function (token) {
        token.csrfToken = csrf().create(req.session.csrfSecret);
      });
      logger.info('Showing tokens view -', {
        view: TOKEN_VIEW
      });
      response(req.headers.accept, res, TOKEN_VIEW, {
        'active': false,
        'header': "revoked-tokens",
        'token_state': "revoked",
        'tokens': revokedTokens,
        'tokens_singular': revokedTokens.length == 1
      });
    }).on('error', function (err) {
      logger.error('[%s] Calling publicAuth to get revoked tokens threw exception -', correlationId, {
        service: 'publicAuth',
        method: 'GET',
        url: url,
        err: err
      });
      renderErrorView(req, res, ERROR_MESSAGE);
    });
    // END OF MOVE DOWN TO MDOEL LEVEL

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
    var correlationId = req.headers[CORRELATION_HEADER] || '';
    // MOVE DOWN TO MODEL LEVEL
    var payload = {
      headers: {"Content-Type": "application/json"},
      data: {
        'account_id': accountId,
        'description': description,
        'created_by': req.user.email
      }
    };

    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;

    logger.debug('Calling publicAuth to create a dev token -', {
      service: 'publicAuth',
      method: 'POST',
      url: publicAuthUrl
    });
    var startTime = new Date();
    client.post(publicAuthUrl, withCorrelationHeader(payload, correlationId), function (publicAuthData, publicAuthResponse) {
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - GET to ${publicAuthUrl} ended - elapsed time: ${duration} ms`);
      if (publicAuthResponse.statusCode !== 200) {
        return renderErrorView(req, res, 'Error creating dev token for account');
      }

      response(req.headers.accept, res, TOKEN_GENERATE_VIEW, {
        token: publicAuthData.token,
        description: description
      });

    }).on('error', function (err) {
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - GET to ${publicAuthUrl} ended - elapsed time: ${duration} ms`);
      logger.error('[%s] Calling publicAuth threw exception -', correlationId, {
        service: 'publicAuth',
        method: 'POST',
        url: publicAuthUrl,
        error: err
      });
      renderErrorView(req, res, ERROR_MESSAGE);
    });
    // END OF MOVE DOWN TO MODEL LEVEL

  });
};

module.exports.update = function (req, res) {
  // BUT I THINK IT SHOULD BE? IS THIS JUST A SHORCTCUT? 
  // this does not need to be explicitly tied down to account_id
  // right now because the UUID space is big enough that no-one
  // will be able to discover other peoples' tokens to change them
  
  // MOVE DOWN TO MODE LEVEL
  var requestPayload = {
    headers: {"Content-Type": "application/json"},
    data: {
      token_link: req.body.token_link,
      description: req.body.description
    }
  };

  var correlationId = req.headers[CORRELATION_HEADER] || '';

  var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
  var startTime = new Date();

  client.put(publicAuthUrl, withCorrelationHeader(requestPayload, correlationId), function (publicAuthData, publicAuthResponse) {
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - PUT to ${publicAuthUrl} ended - elapsed time: ${duration} ms`);
    var responseStatusCode = publicAuthResponse.statusCode;
    if (responseStatusCode != 200) {
      res.sendStatus(responseStatusCode);
      return;
    }

    response(req.headers.accept, res, "includes/_token", {
      'token_link': publicAuthData.token_link,
      'created_by': publicAuthData.created_by,
      'issued_date': publicAuthData.issued_date,
      'last_used': publicAuthData.last_used,
      'description': publicAuthData.description,
      'csrfToken': csrf().create(req.session.csrfSecret)
    });

  }).on('error', function (err) {
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - PUT to ${publicAuthUrl} ended - elapsed time: ${duration} ms`);
    logger.error('[%s] Calling publicAuth threw exception -', correlationId, {
      service: 'publicAuth',
      method: 'PUT',
      url: publicAuthUrl,
      error: err
    });
    res.sendStatus(500);
  });
  // END OF MOVED DOWN TO MODEL LEVEL
};

module.exports.destroy = function (req, res) {
  var accountId = auth.get_gateway_account_id(req);
  var publicAuthUrl = process.env.PUBLIC_AUTH_URL + '/{accountId}';
  var correlationId = req.headers[CORRELATION_HEADER] || '';
  var url = publicAuthUrl.replace('{accountId}', accountId);
  // MOVE DOWN TO MODEL LEVEL
  var requestPayload = {
    headers: {"Content-Type": "application/json"},
    data: {
      token_link: req.query.token_link
    }
  };

  logger.debug('Calling public auth -', {
    service:'publicAuth',
    method:'DELETE',
    url:url
  });

  var startTime = new Date();

  client.delete(url, withCorrelationHeader(requestPayload, correlationId), function (publicAuthData, publicAuthResponse) {
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - DELETE to ${url} ended - elapsed time: ${duration} ms`);

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
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - DELETE to ${url} ended - elapsed time: ${duration} ms`);
    logger.error('[%s] Calling publicAuth threw exception -', correlationId, {
      service: 'publicAuth',
      method: 'DELETE',
      url: publicAuthUrl,
      error: err
    });
    res.sendStatus(500);
  });
  // END OF MOVE DOWN TO MODEL LEVEL
};

function withValidAccountId(req, res, accountId, callback) {
  var connectorUrl = process.env.CONNECTOR_URL + '/v1/api/accounts/{accountId}';
  var url = connectorUrl.replace("{accountId}", accountId);
  var correlationId = req.headers[CORRELATION_HEADER] || '';
  var args = {};
  // MOVE DOWN TO MODEL LEVEL
  logger.debug('Calling connector -', {
    service:'publicAuth',
    method: 'GET',
    url: url
  });
  var startTime = new Date();
  client.get(url, withCorrelationHeader(args, correlationId), function (connectorData, connectorResponse) {
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);
    if (connectorResponse.statusCode != 200) {
      renderErrorView(req, res, ERROR_MESSAGE);
      return;
    }
    callback(accountId, req, res);
  }).on('error', function (err) {
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);
    logger.debug('[%s] Calling connector threw exception -', correlationId, {
      service:'connector',
      method: 'GET',
      url: connectorUrl
    });
    renderErrorView(req, res, ERROR_MESSAGE);
  });
  // END OF MOVE DOWN TO MODEL D
}
