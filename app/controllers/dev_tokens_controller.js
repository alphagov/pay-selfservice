var logger = require('winston');

var response = require('../utils/response.js').response;
var ERROR_MESSAGE = require('../utils/response.js').ERROR_MESSAGE;
var renderErrorView = require('../utils/response.js').renderErrorView;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports.bindRoutesTo = function (app) {

  var TOKEN_PATH = '/tokens';
  var TOKEN_GENERATION_PATH = '/tokens/generate';
  var TOKEN_VIEW = 'token';
  var TOKEN_GENERATE_VIEW = 'token_generate';

  app.get(TOKEN_PATH + '/:accountId', function (req, res) {

    logger.info('GET ' + TOKEN_PATH + '/:accountId');

    var connectorUrl = process.env.CONNECTOR_URL;
    var accountId = req.params.accountId;
    client.get(connectorUrl.replace("{accountId}",accountId), function (connectorData, connectorResponse) {

      if (connectorResponse.statusCode != 200) {
        renderErrorView(req, res, ERROR_MESSAGE);
        return;
      }

      var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
      client.get(publicAuthUrl + "/" + accountId, function (publicAuthData, publicAuthResponse) {

        var issuedTokens = publicAuthData.tokens;
        responsePayload = {
          'account_id': accountId,
          'tokens': issuedTokens,
          'header2': createSentenceBasedOn(issuedTokens.length)
        };
        response(req.headers.accept, res, TOKEN_VIEW, responsePayload);

      }).on('error', function (err) {
        logger.error('Exception raised calling connector');
        renderErrorView(req, res, ERROR_MESSAGE);
      });

    }).on('error', function (err) {
      logger.error('Exception raised calling connector');
      renderErrorView(req, res, ERROR_MESSAGE);
    });

  });

  app.get(TOKEN_GENERATION_PATH + '/:accountId', function (req, res) {

    logger.info('GET ' + TOKEN_GENERATION_PATH + '/:accountId');

    var connectorUrl = process.env.CONNECTOR_URL;
    var accountId = req.params.accountId;
    client.get(connectorUrl.replace("{accountId}",accountId), function (connectorData, connectorResponse) {

      if (connectorResponse.statusCode != 200) {
        renderErrorView(req, res, ERROR_MESSAGE);
        return;
      }

      responsePayload = {'account_id': accountId};
      var tokenInSession = req.session_state.token;
      if (tokenInSession) {
        responsePayload.token = tokenInSession;
        responsePayload.description = req.session_state.description;
        delete req.session_state.token;
        delete req.session_state.description;
      }
      response(req.headers.accept, res, TOKEN_GENERATE_VIEW, responsePayload);

    }).on('error', function (err) {
      logger.error('Exception raised calling connector');
      renderErrorView(req, res, ERROR_MESSAGE);
    });

  });

  app.post(TOKEN_GENERATION_PATH, function (req, res) {

    logger.info('POST ' + TOKEN_PATH);

    if (req.session_state.token) {
      delete req.session_state.token;
      delete req.session_state.description;
      renderErrorView(req, res, ERROR_MESSAGE);
      return;
    }

    var connectorUrl = process.env.CONNECTOR_URL;
    var accountId = req.body.accountId;
    client.get(connectorUrl.replace("{accountId}",accountId), function (connectorData, connectorResponse) {

      if (connectorResponse.statusCode != 200) {
        renderErrorView(req, res, ERROR_MESSAGE);
        return;
      }

      var description = req.body.description;
      var payload = {
        headers: {"Content-Type": "application/json"},
        data: {
          'account_id': accountId,
          'description': 'description'
        }
      };

      var publicAuthUrl = process.env.PUBLIC_AUTH_URL;
      client.post(publicAuthUrl, payload, function (publicAuthData, publicAuthResponse) {

        if (publicAuthResponse.statusCode === 200) {
          req.session_state.token = publicAuthData.token;
          req.session_state.description = description;
          res.redirect(303, TOKEN_GENERATION_PATH + "/" + accountId);
          return;
        }
        renderErrorView(req, res, 'Payment could not be processed, please contact your issuing bank');

      }).on('error', function (err) {
        logger.error('Exception raised calling publicauth');
        renderErrorView(req, res, ERROR_MESSAGE);
      });

    }).on('error', function (err) {
      logger.error('Exception raised calling publicauth');
      renderErrorView(req, res, ERROR_MESSAGE);
    });

  });

  function createSentenceBasedOn(numerOfTokens) {
    if (numerOfTokens==0) return "There are no active developer keys"
    else if (numerOfTokens==1) return "There is 1 active developer key"
    return "There are " + numerOfTokens + " active developer keys"
  }

}