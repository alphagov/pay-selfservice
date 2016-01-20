var logger = require('winston');
var changeCase = require('change-case')

var response = require('../utils/response.js').response;
var ERROR_MESSAGE = require('../utils/response.js').ERROR_MESSAGE;
var renderErrorView = require('../utils/response.js').renderErrorView;

var Client = require('node-rest-client').Client;
var client = new Client();
var auth = require('../services/auth_service.js');

module.exports.bindRoutesTo = function (app) {
  var CREDENTIALS_PATH = '/selfservice/credentials';

  function showSuccessView(connectorData, viewMode, req, res) {
    var paymentProvider = connectorData.payment_provider;
    logger.info('Showing credentials for: ' + paymentProvider);

    var responsePayload = {
      'payment_provider': changeCase.titleCase(paymentProvider),
      'credentials': connectorData.credentials // this will never contain a password field
    };
    if (!viewMode) responsePayload.editMode = 'true';

    response(req.headers.accept, res, 'provider_credentials/'+paymentProvider, responsePayload);
  }

  app.get(CREDENTIALS_PATH, auth.enforce, function (req, res) {
    var accountId = auth.get_account_id(req);

    var viewMode = req.query.edit === undefined;
    logger.info('GET ' + CREDENTIALS_PATH);
    logger.info('View mode: ' + viewMode);

    var connectorUrl = process.env.CONNECTOR_URL;
    client.get(connectorUrl + "/v1/frontend/accounts/" + accountId, function (connectorData, connectorResponse) {

      switch (connectorResponse.statusCode) {
        case 200:
          showSuccessView(connectorData, viewMode, req, res);
          break;
        default:
          renderErrorView(req, res, ERROR_MESSAGE);
      }

    }).on('error', function (err) {
        logger.error('Exception raised calling connector:' + err);
        renderErrorView(req, res, ERROR_MESSAGE);
    });

  });

  app.post(CREDENTIALS_PATH, auth.enforce, function (req, res) {
    var accountId = auth.get_account_id(req);
    
    logger.info('POST ' + CREDENTIALS_PATH);

    var requestPayload = {
      headers:{"Content-Type": "application/json"},
      data: {
        username: req.body.username,
        password: req.body.password
      }
    };

    if('merchantId' in req.body) {
      requestPayload.data.merchant_id = req.body.merchantId;
    }

    var connectorUrl = process.env.CONNECTOR_URL;
    client.put(connectorUrl + "/v1/frontend/accounts/" + accountId, requestPayload, function (connectorData, connectorResponse) {

      switch (connectorResponse.statusCode) {
        case 200:
          res.redirect(303, CREDENTIALS_PATH);
          break;
          
        default:
          renderErrorView(req, res, ERROR_MESSAGE);
      }

    }).on('error', function (err) {
        logger.error('Exception raised calling connector:' + err);
        renderErrorView(req, res, ERROR_MESSAGE);
    });
  });
}