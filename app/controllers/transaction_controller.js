var response = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var transactionView = require('../utils/transaction_view.js');
var jsonToCsv = require('../utils/json_to_csv.js');
var auth = require('../services/auth_service.js');
var _ = require('lodash');
var date = require('../utils/dates.js');
var logger = require('winston');
var router = require('../routes.js');
var Transaction = require('../models/transaction.js');
var Charge = require('../models/charge.js');
var getFilters = require('../utils/filters.js').getFilters;
var url = require('url');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var client = new ConnectorClient(process.env.CONNECTOR_URL);

module.exports = {

  index: function (req, res) {
    var accountId = auth.get_gateway_account_id(req);
    var filters = getFilters(req);
    req.session.filters = url.parse(req.url).query;
    var init = function () {
      if (!filters.valid) return error("Invalid search");
      Transaction
        .search(accountId, filters.result)
        .then(onSuccessSearchTransactions, () => error("Unable to retrieve list of transactions."))
    };

    var onSuccessSearchTransactions = function (transactions) {
      var onSuccessGetAllCards = function (allCards) {
        transactions.search_path = router.paths.transactions.index;
        var model = transactionView.buildPaymentList(transactions, allCards, accountId, filters.result);
        response(req.headers.accept, res, 'transactions/index', model)
      };

      client
        .withGetAllCardTypes(onSuccessGetAllCards)
        .on('connectorError', () => error("Unable to retrieve card types."));
    };

    var error = function (msg) {
      renderErrorView(req, res, msg);
    };

    init();
  },

  download: function (req, res) {
    var accountId = auth.get_gateway_account_id(req);
    var filters = req.query;
    var name = "GOVUK Pay " + date.dateToDefaultFormat(new Date()) + '.csv';

    var init = function () {
        Transaction.searchAll(accountId, filters)
          .then(toCsv)
          .then(render)
          .catch(error);
      },

      toCsv = function (json) {
        return jsonToCsv(json.results);
      },

      render = function (csv) {
        logger.debug('Sending csv attachment download -', {'filename': name});
        res.setHeader('Content-disposition', 'attachment; filename=' + name);
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
      },

      error = function (connectorError) {
        var msg = (connectorError) ? 'Internal server error' :
          'Unable to download list of transactions.';
        renderErrorView(req, res, msg);
      };

    init();
  },

  show: function (req, res) {
    var accountId = auth.get_gateway_account_id(req);
    var chargeId = req.params.chargeId;
    var defaultMsg = 'Error processing transaction view';
    var notFound = 'Charge not found';
    var init = function () {
        Charge.findWithEvents(accountId, chargeId)
          .then(render, error);
      },

      render = function (data) {
        data.indexFilters = req.session.filters;
        response(req.headers.accept, res, 'transactions/show', data);
      },

      error = function (err) {
        var msg = (err == 'NOT_FOUND') ? notFound : defaultMsg;
        renderErrorView(req, res, msg);
      };


    init();
  },

  refund: function (req, res) {
    var accountId = auth.get_gateway_account_id(req);
    var chargeId = req.params.chargeId;
    var show = router.generateRoute(router.paths.transactions.show, {
      chargeId: chargeId
    });
    
    var refundAmount = (req.body['refund-type'] === 'full' ) ? req.body['full-amount'] : req.body['refund-amount'];
    var refundAmountAvailable = req.body['refund-amount-available'];

    var refundMatch = /^([0-9]+)(?:\.([0-9]{2}))?$/.exec(refundAmount);
    
    if (refundMatch) {
      var refundAmountForConnector = parseInt(refundMatch[1]) * 100;
      var refundAmountAvailableForConnector = parseInt(refundAmountAvailable) * 100;
      if (refundMatch[2]) refundAmountForConnector += parseInt(refundMatch[2]);
      
      var errReasonMessages = {
        "REFUND_FAILED": "Can't process refund",
        "full": "Can't do refund: This charge has been already fully refunded",
        "amount_not_available": "Can't do refund: The requested amount is bigger than the amount available for refund",
        "amount_min_validation": "Can't do refund: The requested amount is less than the minimum accepted for issuing a refund for this charge",
        "refund_amount_available_mismatch": "Pre condition failed, the refund_amount_available in the refund request is a mismatch"
      };

      Charge.refund(accountId, chargeId, refundAmountForConnector, refundAmountAvailableForConnector)
        .then(function () {
          res.redirect(show);
        }, function (err) {
          var msg = errReasonMessages[err] ? errReasonMessages[err] : errReasonMessages.REFUND_FAILED;
          renderErrorView(req, res, msg);
        });
    }
    else {
      renderErrorView(req, res, "Can't do refund: amount must be pounds (10) or pounds and pence (10.10)");
    }
  }
};
