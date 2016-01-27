var response = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var TransactionView = require('../utils/transaction_view.js').TransactionView;
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var transactionView = new TransactionView();
var auth = require('../services/auth_service.js');
var TRANSACTIONS_INDEX_PATH = '/selfservice/transactions';
var TRANSACTIONS_SHOW_PATH = TRANSACTIONS_INDEX_PATH + '/:chargeId';

function connectorClient() {
  return new ConnectorClient(process.env.CONNECTOR_URL);
}
var transactionsIndex = function (req, res) {
  var accountId = auth.get_account_id(req);

  var init = function(){
    connectorClient()
      .withTransactionList(accountId, req.body, showTransactions)
      .on('connectorError', showError);
  };

  var showTransactions = function (charges, filters) {
    charges.search_path = TRANSACTIONS_INDEX_PATH;
    var data = transactionView.buildPaymentList(charges, accountId, filters);
    response(req.headers.accept, res, 'transactions/index', data);
  };

  var showError = function (err, response) {
    if (!response) return renderErrorView(req, res, 'Internal server error');

    var bad_req = response.statusCode === 400;
    var error = (bad_req) ? err : 'Unable to retrieve list of transactions.';

    renderErrorView(req, res, error);
  };

  init();
}

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

  var showError = function (err, response) {
    if (!response) return renderErrorView(req, res, 'Error processing transaction view');

    var four_oh_four = response.statusCode === 404;
    var error = (four_oh_four) ? 'charge not found' : 'Error processing transaction view';

    renderErrorView(req, res, error);
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
