var response        = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var transactionView = require('../utils/transaction_view.js');
var jsonToCsv       = require('../utils/json_to_csv.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var auth            = require('../services/auth_service.js');
var _               = require('lodash');
var date            = require('../utils/dates.js');
var router          = require('../routes.js');
var session = require('../utils/session');
var Transaction     = require('../models/transaction.js');
var paginationKeys = ['first_page', 'prev_page', 'next_page', 'last_page'];


function getPaginationLinks(data) {
    return _.pick(data._links, paginationKeys);
}

function connectorClient() {
  return new ConnectorClient(process.env.CONNECTOR_URL);
}

function filledBodyKeys(req) {
  return _.omitBy(req.body, _.isEmpty);
}

function createErrorhandler(req, res, defaultErrorMessage) {
  return function (connectorError, connectorResponse) {
    var errorMessage;

    if (connectorError) {
      errorMessage = 'Internal server error';
    } else if (connectorResponse.statusCode === 404) {
      errorMessage = 'Charge not found';
    } else {
      errorMessage = defaultErrorMessage;
    }

    renderErrorView(req, res, errorMessage);
  };
};

module.exports = {

  transactionsIndex: function (req, res) {
    var accountId = auth.get_account_id(req);
    var filters = filledBodyKeys(req);
    var errorHandler = createErrorhandler(req, res, 'Unable to retrieve list of transactions.');

    function showTransactions(charges) {
      var data;

      charges.search_path = router.paths.transactions.index;
      data = transactionView.buildPaymentList(charges, accountId, filters);
      response(req.headers.accept, res, 'transactions/index', data);
    };

    connectorClient()
      .withTransactionList(accountId, filters, showTransactions)
      .on('connectorError', errorHandler);
  },

  transactionsDownload: function (req, res) {
    var accountId = auth.get_account_id(req);
    var filters = req.query;
    var name = "GOVUK Pay " + date.dateToDefaultFormat(new Date()) + '.csv';

    var init = function () {
    Transaction.search(accountId, filters)
      .then(function(json){
        return jsonToCsv(json.results);
      }, showError)
      .then(function(csv){
        res.setHeader('Content-disposition', 'attachment; filename=' + name);
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
      });
  };

    var showError = function (connectorError) {
      res.removeHeader("Content-Type");
      res.removeHeader("Content-disposition");

      if (connectorError) {
        renderErrorView(req, res, 'Internal server error');
        return;
      }
      
      renderErrorView(req, res, 'Unable to download list of transactions.');
    };

    init();
  },

  transactionsShow: function(req, res) {
    var accountId = auth.get_account_id(req);
    var chargeId = req.params.chargeId;
    var errorHandler = createErrorhandler(req, res, 'Error processing transaction view');

    function foundCharge(charge) { //on success of finding a charge
      var charge = charge;
      connectorClient().withChargeEvents(accountId, chargeId, function(events) {
        foundChargeEvents(events, charge);
      }).on('connectorError', errorHandler);
    }

    function foundChargeEvents(events, charge) { //on success of finding events for charge
      var data = transactionView.buildPaymentView(charge, events);
      response(req.headers.accept, res, 'transactions/show', data);
    }

    connectorClient().withGetCharge(accountId, chargeId, foundCharge)
      .on('connectorError', errorHandler);
  }
};
