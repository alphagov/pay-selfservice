var response = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var transactionView = require('../utils/transaction_view.js');
var jsonToCsv = require('../utils/json_to_csv.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var auth = require('../services/auth_service.js');
var _ = require('lodash');
var date = require('../utils/dates.js');
var logger = require('winston');
var router = require('../routes.js');
var Transaction = require('../models/transaction.js');
var qs = require('qs');
var check = require('check-types');
var Paginator = require('../utils/paginator.js');

function getFilters(req) {
  var all = qs.parse(req.query);
  return _.omitBy(all, _.isEmpty);
}

function connectorClient() {
  return new ConnectorClient(process.env.CONNECTOR_URL);
}

function filledBodyKeys(req) {
  return _.omitBy(req.body, _.isEmpty);
}

function validateFilters(filters) {
  var pageSizeIsNull = !check.assigned(filters.pageSize),
    pageSizeInRange = check.inRange(Number(filters.pageSize), 1, Paginator.MAX_PAGE_SIZE),
    pageIsNull = !check.assigned(filters.page),
    pageIsPositive = check.positive(Number(filters.page));

  return (pageSizeIsNull || pageSizeInRange) &&
         (pageIsNull || pageIsPositive);
}

module.exports = {

  transactionsIndex: function (req, res) {
    var accountId = auth.get_account_id(req);

    var filters = getFilters(req);

    if (!validateFilters(filters)) {
      renderErrorView(req, res, "Invalid search");
    }
    Transaction
      .search(accountId, filters)
      .then(function(json){
        json.search_path = router.paths.transactions.index;
        var data = transactionView.buildPaymentList(json, accountId, filters);
        response(req.headers.accept, res, 'transactions/index', data);
      }, function(){
        renderErrorView(req, res, 'Unable to retrieve list of transactions.');
      });
  },

  transactionsDownload: function (req, res) {
    var accountId = auth.get_account_id(req);
    var filters = req.query;
    var name = "GOVUK Pay " + date.dateToDefaultFormat(new Date()) + '.csv';

    var init = function () {
      Transaction.searchAll(accountId, filters)
        .then(function (json) {
          return jsonToCsv(json.results);
        }, showError)
        .then(function (csv) {
          logger.info('Sending csv attachment download -', {'filename': name});
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

  transactionsShow: function (req, res) {
    var accountId = auth.get_account_id(req);
    var chargeId = req.params.chargeId;
    var defaultError = 'Error processing transaction view';

    function foundCharge(charge) { //on success of finding a charge
      var charge = charge;
      connectorClient().withChargeEvents(accountId, chargeId, function (events) {
        foundChargeEvents(events, charge);
      }).on('connectorError', ()=> {
        renderErrorView(req, res, defaultError);
      });
    }

    function foundChargeEvents(events, charge) { //on success of finding events for charge
      var data = transactionView.buildPaymentView(charge, events);
      response(req.headers.accept, res, 'transactions/show', data);
    }

    connectorClient().withGetCharge(accountId, chargeId, foundCharge)
      .on('connectorError', (err, response)=> {
        var message = defaultError;
        if (response && response.statusCode === 404) message = 'Charge not found';
        renderErrorView(req, res, message);
      });
  }
};
