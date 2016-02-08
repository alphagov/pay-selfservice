var response        = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var TransactionView = require('../utils/transaction_view.js').TransactionView;
var transactionView = new TransactionView();
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var auth            = require('../services/auth_service.js');
var _               = require('lodash');
var date            = require('../utils/dates.js');
var router          = require('../routes.js');


// TODO: Externalise into properties
var TRANSACTION_CSV_FILENAME = 'GOVUK Pay <%= timestamp %>.csv';
var CONTENT_TYPE_CSV = 'text/csv';


function connectorClient() {
  return new ConnectorClient(process.env.CONNECTOR_URL);
}

var filledBodyKeys = function(req){
return _.omitBy(req.body, _.isEmpty);
}

module.exports.transactionsIndex = function (req, res) {
  var accountId = auth.get_account_id(req);
  var filters = filledBodyKeys(req);

  var init = function(){
    connectorClient()
      .withTransactionList(accountId, filters, showTransactions)
      .on('connectorError', showError);
  };

  var showTransactions = function (charges) {
    charges.search_path = router.paths.transactions.index
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

module.exports.transactionsDownload = function (req, res) {
  var accountId = auth.get_account_id(req);
  var filters = req.query;

  var init = function () {
    connectorClient()
        .withTransactionDownload(accountId, filters, setHeaders)
        .on('connectorError', showError);
  };

  var setHeaders = function() {
    var buildFileName = function() {
      var compiled = _.template(TRANSACTION_CSV_FILENAME)
      return compiled({ 'timestamp' : date.dateToDefaultFormat(new Date())})
    }

    res.setHeader('Content-Type', CONTENT_TYPE_CSV);
    res.setHeader('Content-disposition', 'attachment; filename=' + buildFileName());
    return res;
  }

  var showError = function (connectorError) {
    res.removeHeader("Content-Type");
    res.removeHeader("Content-disposition");

    if (connectorError) {
      renderErrorView(req, res, 'Internal server error');
      return;
    };

    renderErrorView(req, res, 'Unable to download list of transactions.');
  };

  init();
}

module.exports.transactionsShow = function(req, res) {
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
}
