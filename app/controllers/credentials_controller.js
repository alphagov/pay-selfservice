const EDIT_CREDENTIALS_MODE = 'editCredentials';
const EDIT_NOTIFICATION_CREDENTIALS_MODE = 'editNotificationCredentials';

var logger                = require('winston');
var changeCase            = require('change-case');

var response              = require('../utils/response.js').response;
var ERROR_MESSAGE         = require('../utils/response.js').ERROR_MESSAGE;
var errorView             = require('../utils/response.js').renderErrorView;
var ConnectorClient       = require('../services/clients/connector_client').ConnectorClient;
var auth                  = require('../services/auth_service.js');
var router                = require('../routes.js');
var CORRELATION_HEADER    = require('../utils/correlation_header.js').CORRELATION_HEADER;

var connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL);

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

  response(req, res, 'provider_credentials/' + paymentProvider, responsePayload);
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

  connectorClient().getAccount({
    gatewayAccountId: accountId,
    correlationId: correlationId
  }, function (connectorData, connectorResponse) {
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);
    if (connectorResponse.statusCode === 200) showSuccessView(connectorData, viewMode, req, res);
  })
  .on('connectorError', function (err, connectorResponse) {
    var duration = new Date() - startTime;
    logger.info(`[${correlationId}] - GET to ${url} ended - elapsed time: ${duration} ms`);

    if (connectorResponse && connectorResponse.statusCode) {
      logger.error(`[${correlationId}] Calling connector to get account information failed -`, {
        service: 'connector',
        method: 'GET',
        url: accountUrl,
        status: connectorResponse.statusCode
      });
    } else {
      logger.error(`[${correlationId}] Calling connector to get account information threw exception -`, {
        service: 'connector',
        method: 'GET',
        url: accountUrl,
        error: err
      });
    }

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
        username: req.body.username,
        password: req.body.password
    };

    logger.info('Calling connector to update provider notification credentials -', {
      service: 'connector',
      method: 'POST',
      url: '/frontend/accounts/{id}/notification-credentials'
    });

    var startTime = new Date();
    var url = connectorUrl.replace("{accountId}", accountId);
    var correlationId = req.headers[CORRELATION_HEADER] || '';

    connectorClient().postAccountNotificationCredentials({
      payload: requestPayLoad,
      correlationId: correlationId,
      gatewayAccountId: accountId
    }, function(connectorData, connectorResponse) {
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - POST to ${url} ended - elapsed time: ${duration} ms`);
      res.redirect(303, router.paths.credentials.index);

    }).on('connectorError', function(err, connectorResponse){
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - POST to ${url} ended - elapsed time: ${duration} ms`);
      if (connectorResponse && connectorResponse.statusCode) {
        logger.error(`[${correlationId}] Calling connector to update provider notification credentials failed -`, {
          service: 'connector',
          method: 'POST',
          url: connectorUrl,
          status: connectorResponse.statusCode
        });
      } else {
        logger.error(`[${correlationId}] Calling connector to update provider notification credentials threw exception  -`, {
          service: 'connector',
          method: 'POST',
          url: connectorUrl,
          error: err
        });
      }

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
        credentials: {
          username: req.body.username,
          password: req.body.password
        }
    };

    if ('merchantId' in req.body) {
      requestPayload.credentials.merchant_id = req.body.merchantId;
    }

    logger.info('Calling connector to update provider credentials -', {
      service: 'connector',
      method: 'PATCH',
      url: '/frontend/accounts/{id}/credentials'
    });
    var url = connectorUrl.replace("{accountId}", accountId);
    var correlationId = req.headers[CORRELATION_HEADER] || '';

    var startTime = new Date();
    connectorClient().patchAccountCredentials({
      payload: requestPayload,
      correlationId: correlationId,
      gatewayAccountId: accountId
    }, function (connectorData, connectorResponse) {
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - PATCH to ${url} ended - elapsed time: ${duration} ms`);
      res.redirect(303, router.paths.credentials.index);
    }).on('connectorError', function (err, connectorResponse) {
      var duration = new Date() - startTime;
      logger.info(`[${correlationId}] - PATCH to ${url} ended - elapsed time: ${duration} ms`);

      if (connectorResponse && connectorResponse.statusCode) {
        logger.error(`[${correlationId}] Calling connector to update provider credentials failed. Redirecting back to credentials view -`, {
          service: 'connector',
          method: 'PATCH',
          url: connectorUrl,
          status: connectorResponse.statusCode
        });
      } else {
        logger.error(`[${correlationId}] Calling connector to update provider credentials threw exception  -`, {
          service: 'connector',
          method: 'PATCH',
          url: connectorUrl,
          error: err
        });
      }
      errorView(req, res, ERROR_MESSAGE);
    });
  }
};
