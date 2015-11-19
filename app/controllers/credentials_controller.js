var logger = require('winston');
var changeCase = require('change-case')

var response = require('../utils/response.js').response;
var ERROR_MESSAGE = require('../utils/response.js').ERROR_MESSAGE;
var renderErrorView = require('../utils/response.js').renderErrorView;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports.bindRoutesTo = function (app) {

  var CREDENTIALS_PATH = '/selfservice/credentials';

  function showSuccessView(connectorData, req, res) {

    var paymentProvider = connectorData.payment_provider;
    logger.info('Showing credentials for: ' + paymentProvider);

    var responsePayload = {
      'payment_provider': changeCase.titleCase(paymentProvider)
    };

    var storedCredentials = connectorData.credentials;
    responsePayload.credentials = storedCredentials;
    if (Object.keys(storedCredentials).length != 0) {
      responsePayload.credentials.password = '****';
    }

    logger.info(JSON.stringify(responsePayload));
    response(req.headers.accept, res, 'provider_credentials_views/'+paymentProvider, responsePayload);
  }

  app.get(CREDENTIALS_PATH + '/:accountId', function (req, res) {

    logger.info('GET ' + CREDENTIALS_PATH + '/:accountId');

    var accountId = req.params.accountId;
    var connectorUrl = process.env.CONNECTOR_URL;
    client.get(connectorUrl + "/v1/frontend/accounts/" + accountId, function (connectorData, connectorResponse) {

      switch (connectorResponse.statusCode) {
        case 200:
          showSuccessView(connectorData, req, res);
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