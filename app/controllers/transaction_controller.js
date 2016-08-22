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

module.exports = {

  index: function (req, res) {
    var accountId = auth.get_account_id(req);
    var filters = getFilters(req);
    var init = function () {
        if (!filters.valid) return error("Invalid search");
        Transaction
          .search(accountId, filters.result)
          .then(render, ()=> error("Unable to retrieve list of transactions."));
      },

      render = function (json) {
        json.search_path = router.paths.transactions.index;
        var data = transactionView.buildPaymentList(json, accountId, filters.result);
        response(req.headers.accept, res, 'transactions/index', data);
      },

      error = function (msg) {
        renderErrorView(req, res, msg);
      };

    init();
  },

  download: function (req, res) {
    var accountId = auth.get_account_id(req);
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
        logger.info('Sending csv attachment download -', {'filename': name});
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
    var accountId = auth.get_account_id(req);
    var chargeId = req.params.chargeId;
    var defaultMsg = 'Error processing transaction view';
    var notFound = 'Charge not found';
    var init = function () {
        Charge.findWithEvents(accountId, chargeId)
          .then(render, error);
      },

      render = function (data) {
        response(req.headers.accept, res, 'transactions/show', data);
      },

      error = function (err) {
        var msg = (err == 'NOT_FOUND') ? notFound : defaultMsg;
        renderErrorView(req, res, msg);
      };

    init();
  },

  refund: function (req, res) {

    var accountId = auth.get_account_id(req);
    var chargeId = req.params.chargeId;
    var show = router.generateRoute(router.paths.transactions.show, {
      chargeId: chargeId
    });
    var refundAmount = (req.body['refund-type'] === 'full' ) ? req.body['full-amount'] : req.body['refund-amount'];

    var errReasonMessages = {
      "REFUND_FAILED": "Can't process refund",
      "full": "Can't do refund: This charge has been already fully refunded",
      "amount_not_available": "Can't do refund: The requested amount is bigger than the amount available for refund",
      "amount_min_validation": "Can't do refund: The requested amount is less than the minimum accepted for issuing a refund for this charge",
    };

    Charge.refund(accountId, chargeId, refundAmount * 100)
      .then(function () {
        res.redirect(show);
      }, function (err) {
        console.log('>>>>>>>>>> err', err);
        var msg = errReasonMessages[err] ? errReasonMessages[err] : errReasonMessages.REFUND_FAILED;
        renderErrorView(req, res, msg);
      });
  }
};
