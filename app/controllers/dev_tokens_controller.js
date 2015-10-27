var logger = require('winston');

var response = require('../utils/response.js').response;
var ERROR_MESSAGE = require('../utils/response.js').ERROR_MESSAGE;
var renderErrorView = require('../utils/response.js').renderErrorView;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports.bindRoutesTo = function (app) {

  var TOKEN_PATH = '/selfservice/tokens';
  var TOKEN_GENERATION_GET_PATH = '/selfservice/tokens/:accountId/generate';
  var TOKEN_GENERATION_POST_PATH = '/selfservice/tokens/generate';

  var TOKEN_VIEW = 'token';
  var TOKEN_GENERATE_VIEW = 'token_generate';

  app.get(TOKEN_PATH + '/:accountId', function (req, res) {

    logger.info('GET ' + TOKEN_PATH + '/:accountId');

    withValidAccountId(req, res, req.params.accountId, function(accountId, req, res) {

      var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
      client.get(publicAuthUrl + "/" + accountId, function (publicAuthData, publicAuthResponse) {
        var issuedTokens = publicAuthData.tokens;
        responsePayload = {
          'account_id': accountId,
          'tokens': issuedTokens
        };
        response(req.headers.accept, res, TOKEN_VIEW, responsePayload);

      }).on('error', function (err) {
        logger.error('Exception raised calling publicauth:' + err);
        renderErrorView(req, res, ERROR_MESSAGE);
      });

    });

  });

  app.get(TOKEN_GENERATION_GET_PATH, function (req, res) {

    logger.info('GET ' + TOKEN_GENERATION_GET_PATH);

    withValidAccountId(req, res, req.params.accountId, function(accountId, req, res) {

      responsePayload = {'account_id': accountId};
      var tokenInSession = req.session_state.token;
      if (tokenInSession) {
        responsePayload.token = tokenInSession;
        responsePayload.description = req.session_state.description;
        delete req.session_state.token;
        delete req.session_state.description;
      }
      response(req.headers.accept, res, TOKEN_GENERATE_VIEW, responsePayload);

    });

  });

  app.post(TOKEN_GENERATION_POST_PATH, function (req, res) {

    logger.info('POST ' + TOKEN_GENERATION_POST_PATH);

    if (req.session_state.token) {
      delete req.session_state.token;
      delete req.session_state.description;
      renderErrorView(req, res, ERROR_MESSAGE);
      return;
    }

    withValidAccountId(req, res, req.body.accountId, function(accountId, req, res) {
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
          req.session_state.token = publicAuthData.token;
          req.session_state.description = description;
          res.redirect(303, TOKEN_GENERATION_GET_PATH.replace(":accountId",accountId));
          return;
        }
        renderErrorView(req, res, 'Error creating dev token for account ' + accountId);

      }).on('error', function (err) {
        logger.error('Exception raised calling publicauth:' + err);
        renderErrorView(req, res, ERROR_MESSAGE);
      });

    });

  });

  app.put(TOKEN_PATH, function (req, res) {
    logger.info('PUT ' + TOKEN_PATH);

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
      if(responseStatusCode!=200) {
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

  });

  app.delete(TOKEN_PATH + '/:accountId', function (req, res) {
    logger.info('DELETE ' + TOKEN_PATH  + '/:accountId');

    var accountId = req.params.accountId;

    var requestPayload = {
      headers:{"Content-Type": "application/json"},
      data: {
        token_link: req.query.token_link
      }
    };

    var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
    client.delete(publicAuthUrl + "/" + accountId, requestPayload, function (publicAuthData, publicAuthResponse) {
      var responseStatusCode = publicAuthResponse.statusCode;
      if(responseStatusCode!=200) {
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

  });

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

}