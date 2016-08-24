var logger        = require('winston');
var changeCase    = require('change-case')
var response      = require('../utils/response.js').response;
var ERROR_MESSAGE = require('../utils/response.js').ERROR_MESSAGE;
var errorView     = require('../utils/response.js').renderErrorView;
var Client        = require('node-rest-client').Client;
var client        = new Client();
var auth          = require('../services/auth_service.js');
var router        = require('../routes.js');

function showSuccessView(connectorData, viewMode, req, res) {
  var paymentProvider = connectorData.payment_provider;

  var responsePayload = {
    'payment_provider': changeCase.titleCase(paymentProvider),
    'credentials': connectorData.credentials // this will never contain a password field
  };

  if (!viewMode) responsePayload.editMode = 'true';

  logger.info('Showing provider credentials view -', {
    view: 'credentials',
    viewMode: viewMode,
    provider: paymentProvider
  });

  response(req.headers.accept, res, 'provider_credentials/' + paymentProvider, responsePayload);
}


module.exports.index = function (req, res) {
  var accountId = auth.get_account_id(req);
  var viewMode = req.query.edit === undefined;
  var accountUrl = process.env.CONNECTOR_URL + "/v1/frontend/accounts/{accountId}";

  logger.info('Calling connector to get account information -', {
    service:'connector',
    method: 'GET',
    url: accountUrl
  });

  client.get(accountUrl.replace("{accountId}", accountId), function (connectorData, connectorResponse) {
    switch (connectorResponse.statusCode) {
      case 200:
        showSuccessView(connectorData, viewMode, req, res);
        break;
      default:
        logger.error('Calling connector to get account information failed -', {
          service:'connector',
          method: 'GET',
          url: accountUrl,
          status: connectorResponse.status
        });
        errorView(req, res, ERROR_MESSAGE);
    }

  }).on('error', function (err) {
    logger.error('Calling connector to get account information threw exception -', {
      service:'connector',
      method: 'GET',
      url: accountUrl,
      error: err
    });
    errorView(req, res, ERROR_MESSAGE);
  });

};


module.exports.update = function (req, res) {

  var accountId = auth.get_account_id(req);
  var connectorUrl = process.env.CONNECTOR_URL + "/v1/frontend/accounts/{accountId}/credentials";

  var requestPayload = {
    headers: {"Content-Type": "application/json"},
    data: {
      credentials: {
        username: req.body.username,
        password: req.body.password
      }
    }
  };

  if ('merchantId' in req.body) {
    requestPayload.data.credentials.merchant_id = req.body.merchantId;
  }

  logger.info('Calling connector to update provider credentials -', {
    service:'connector',
    method: 'PATCH',
    url: '/frontend/accounts/{id}/credentials'
  });

  client.patch(connectorUrl.replace("{accountId}", accountId), requestPayload, function (connectorData, connectorResponse) {
    switch (connectorResponse.statusCode) {
      case 200:
        logger.error('Calling connector to update provider credentials failed. Redirecting back to credentials view -', {
          service:'connector',
          method:'PATCH',
          url: connectorUrl,
          status: connectorResponse.status
        });
        res.redirect(303, router.paths.credentials.index);
        break;
      default:
        errorView(req, res, ERROR_MESSAGE);
    }

  }).on('error', function (err) {
    logger.error('Calling connector to update provider credentials threw exception  -', {
      service: 'connector',
      method: 'GET',
      url: connectorUrl,
      error: err
    });
    errorView(req, res, ERROR_MESSAGE);
  });
};
