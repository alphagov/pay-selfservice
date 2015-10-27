var logger = require('winston');
var response = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var Client = require('node-rest-client').Client;
var client = new Client();

var TRANSACTIONS_LIST_PATH = '/selfservice/transactions/';
var CONNECTOR_CHARGE_PATH = '/v1/frontend/charges';

function formatForView(connectorData) {
  connectorData.results.forEach(function (element) {
    element.amount = (element.amount / 100).toFixed(2);
  });
  return connectorData;
}

module.exports.bindRoutesTo = function (app) {

  app.get(TRANSACTIONS_LIST_PATH + ':gatewayAccountId', function (req, res) {

    var gatewayAccountId = req.params.gatewayAccountId;
    logger.info('GET ' + TRANSACTIONS_LIST_PATH + gatewayAccountId);

    var connectorUrl = process.env.CONNECTOR_URL + CONNECTOR_CHARGE_PATH + '?gatewayAccountId=' + gatewayAccountId;

    client.get(connectorUrl, function (connectorData, connectorResponse) {

      if (connectorResponse.statusCode === 200) {
        response(req.headers.accept, res, 'transactions', formatForView(connectorData));
        return;
      }

      logger.error('Error getting transaction list from connector. Connector response data: ' + connectorData);
      if (connectorResponse.statusCode === 400) {
        renderErrorView(req, res, connectorData.message);
        return;
      }

      renderErrorView(req, res, 'Unable to retrieve list of transactions.');

    }).on('error', function (err) {
      logger.error('Exception raised calling connector:' + err);
      renderErrorView(req, res, 'Internal server error');
    });

  });
};