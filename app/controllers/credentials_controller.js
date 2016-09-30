const EDIT_CREDENTIALS_MODE = 'editCredentials';
const EDIT_NOTIFICATION_CREDENTIALS_MODE = 'editNotificationCredentials';

var logger                = require('winston');
var changeCase            = require('change-case')
var response              = require('../utils/response.js').response;
var ERROR_MESSAGE         = require('../utils/response.js').ERROR_MESSAGE;
var errorView             = require('../utils/response.js').renderErrorView;
var Client                = require('node-rest-client').Client;
var client                = new Client();
var auth                  = require('../services/auth_service.js');
var router                = require('../routes.js');
var CORRELATION_HEADER    = require('../utils/correlation_header.js').CORRELATION_HEADER;
var withCorrelationHeader = require('../utils/correlation_header.js').withCorrelationHeader;

function showSuccessView(connectorData, viewMode, req, res) {
  var paymentProvider = connectorData.payment_provider;
  var responsePayload = {
    'payment_provider': changeCase.titleCase(paymentProvider),
    'credentials': connectorData.credentials,
    'notification_credentials': connectorData.notificationCredentials
  };

  switch(viewMode) {
    case EDIT_CREDENTIALS_MODE:
      responsePayload.editMode = true;
      responsePayload.editNotificationCredentialsMode = false;
      break;
    case EDIT_NOTIFICATION_CREDENTIALS_MODE:
      responsePayload.editMode = false;
      responsePayload.editNotificationCredentialsMode = true;
      break;
    default:
      responsePayload.editMode = false;
      responsePayload.editNotificationCredentialsMode = false;
  }

  logger.debug('Showing provider credentials view -', {
    view: 'credentials',
    viewMode: viewMode,
    provider: paymentProvider
  });

  response(req.headers.accept, res, 'provider_credentials/' + paymentProvider, responsePayload);
}

function loadIndex(req, res, viewMode) {
  var accountId = auth.get_gateway_account_id(req);
  var accountUrl = process.env.CONNECTOR_URL + "/v1/frontend/accounts/{accountId}";

  logger.debug('Calling connector to get account information -', {
    service:'connector',
    method: 'GET',
    url: accountUrl
  });

  var startTime = new Date();
  var url = accountUrl.replace("{accountId}", accountId);
  var correlationId = req.headers[CORRELATION_HEADER] || '';
  var args = {};

  client.get(url, withCorrelationHeader(args, correlationId), function (connectorData, connectorResponse) {
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);

    switch (connectorResponse.statusCode) {
      case 200:
        showSuccessView(connectorData, viewMode, req, res);
        break;
      default:
        logger.error(`[${correlationId}] Calling connector to get account information failed -`, {
          service: 'connector',
          method: 'GET',
          url: accountUrl,
          status: connectorResponse.status
        });
        errorView(req, res, ERROR_MESSAGE);
    }

  }).on('error', function (err) {
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);
    logger.error(`[${correlationId}] Calling connector to get account information threw exception -`, {
      service: 'connector',
      method: 'GET',
      url: accountUrl,
      error: err
    });
    errorView(req, res, ERROR_MESSAGE);
  });
}


module.exports = {
  index: function (req, res) {
    loadIndex(req, res);
  },

  editCredentials: function(req, res) {
    loadIndex(req, res, EDIT_CREDENTIALS_MODE);
  },

  editNotificationCredentials: function(req, res) {
    loadIndex(req, res, EDIT_NOTIFICATION_CREDENTIALS_MODE);
  },

  updateNotificationCredentials: function (req, res) {
    var accountId = auth.get_gateway_account_id((req));
    var connectorUrl = process.env.CONNECTOR_URL + "/v1/api/accounts/{accountId}/notification-credentials";

    var requestPayLoad = {
      headers: {"Content-Type": "application/json"},
      data: {
        username: req.body.username,
        password: req.body.password
      }
    };

    logger.info('Calling connector to update provider notification credentials -', {
      service: 'connector',
      method: 'POST',
      url: '/frontend/accounts/{id}/notification-credentials'
    });

    var startTime = new Date();
    var url = connectorUrl.replace("{accountId}", accountId);
    var correlationId = req.headers[CORRELATION_HEADER] || '';

    client.post(url, withCorrelationHeader(requestPayLoad, correlationId), function(connectorData, connectorResponse) {
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - POST to ${url} ended - elapsed time: ${duration} ms`);
      switch (connectorResponse.statusCode) {
        case 200:
          res.redirect(303, router.paths.credentials.index);
          break;
        default:
          logger.error(`[${correlationId}] Calling connector to update provider notification credentials failed -`, {
            service: 'connector',
            method: 'POST',
            url: connectorUrl,
            error: err
          });
          errorView(req, res, ERROR_MESSAGE);
      }
    }).on('error', function(err){
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - POST to ${url} ended - elapsed time: ${duration} ms`);
      logger.error(`[${correlationId}] Calling connector to update provider notification credentials threw exception  -`, {
        service: 'connector',
        method: 'POST',
        url: connectorUrl,
        error: err
      });
      errorView(req, res, ERROR_MESSAGE);
    });

  },

  update: function (req, res) {
    logger.debug('Calling connector to update provider credentials -', {
      service:'connector',
      method: 'PATCH',
      url: '/frontend/accounts/{id}/credentials'
    });
    var accountId = auth.get_gateway_account_id(req);
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
      service: 'connector',
      method: 'PATCH',
      url: '/frontend/accounts/{id}/credentials'
    });
    var url = connectorUrl.replace("{accountId}", accountId);
    var correlationId = req.headers[CORRELATION_HEADER] || '';

    var startTime = new Date();
    client.patch(url, withCorrelationHeader(requestPayload, correlationId), function (connectorData, connectorResponse) {
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - PATCH to ${url} ended - elapsed time: ${duration} ms`);
      switch (connectorResponse.statusCode) {
        case 200:
          res.redirect(303, router.paths.credentials.index);
          break;
        default:
          logger.error(`[${correlationId}] Calling connector to update provider credentials failed. Redirecting back to credentials view -`, {
            service: 'connector',
            method: 'PATCH',
            url: connectorUrl,
            status: connectorResponse.status
          });
          errorView(req, res, ERROR_MESSAGE);
      }
    }).on('error', function (err) {
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - PATCH to ${url} ended - elapsed time: ${duration} ms`);
      logger.error(`[${correlationId}] Calling connector to update provider credentials threw exception  -`, {
        service: 'connector',
        method: 'GET',
        url: connectorUrl,
        error: err
      });
      errorView(req, res, ERROR_MESSAGE);
    });
  }
};
