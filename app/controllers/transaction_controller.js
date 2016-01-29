var response = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var TransactionView = require('../utils/transaction_view.js').TransactionView;
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var transactionView = new TransactionView();
var auth = require('../services/auth_service.js');
var TRANSACTIONS_INDEX_PATH = '/selfservice/transactions';
var TRANSACTIONS_SHOW_PATH = TRANSACTIONS_INDEX_PATH + '/:chargeId';
var _ = require('lodash');

function connectorClient() {
  return new ConnectorClient(process.env.CONNECTOR_URL);
}

var filledBodyKeys = function(req){
return _.omitBy(req.body, _.isEmpty);
}

var transactionsIndex = function (req, res) {
  var accountId = auth.get_account_id(req);
  var filters = filledBodyKeys(req);

  var init = function(){
    connectorClient()
      .withTransactionList(accountId, filters, showTransactions)
      .on('connectorError', showError);
  };

  var showTransactions = function (charges) {
    charges.search_path = TRANSACTIONS_INDEX_PATH;
    var data = transactionView.buildPaymentList(charges, accountId, filters);
    response(req.headers.accept, res, 'transactions/index', data);
  };
  var showError = function (connectorError) {
    if (connectorError) {
      renderErrorView(req, res, 'Internal server error');
      return;
    };

    renderErrorView(req, res, 'Unable to retrieve list of transactions.');
  };

  init();
};

transactionsShow = function(req, res) {
  var accountId = auth.get_account_id(req);
  var chargeId = req.params.chargeId;

  var init = function() {
    connectorClient().withGetCharge(accountId, chargeId, foundCharge)
    .on('connectorError', showError);
  };

  var foundCharge = function (charge) { //on success of finding a charge
    var charge = charge;
    connectorClient().withChargeEvents(accountId, chargeId, function(events){
      foundEventCharges(events, charge)
    }).on('connectorError', showError);
  };

  var foundEventCharges = function (events,charge) { //on success of finding events for charge
    var data = transactionView.buildPaymentView(charge, events);
    response(req.headers.accept, res, 'transactions/show', data);
  };

  var showError = function (connectorError, connectorResponse) {
    if (connectorError) {
      renderErrorView(req, res, 'Internal server error');
      return;
    };

    var errorMessage = (connectorResponse.statusCode === 404) ? 'Charge not found' : 'Error processing transaction view';
    renderErrorView(req, res, errorMessage);
  };

  init();

};

module.exports.bindRoutesTo = function (app) {
  /**
   * Display all the transactions for a given accountId and/or search paramaters
   */
  app.get(TRANSACTIONS_INDEX_PATH, auth.enforce, transactionsIndex);
  app.post(TRANSACTIONS_INDEX_PATH, auth.enforce, transactionsIndex);

  /**
   *  Display transaction details for a given chargeId of an account.
   */
  app.get(TRANSACTIONS_SHOW_PATH, auth.enforce, transactionsShow);
}
