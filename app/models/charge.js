var Client = require('node-rest-client').Client;
var client = new Client();
var q = require('q');
var _ = require('lodash');
var logger = require('winston');
var paths = require('../paths.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var connector = new ConnectorClient(process.env.CONNECTOR_URL);

var transactionView = require('../utils/transaction_view.js');

module.exports = function (correlationId) {

  correlationId = correlationId || '';

  'use strict';
  var findWithEvents = function (accountId, chargeId) {
    var defer = q.defer();
    var params = {
      gatewayAccountId: accountId,
      chargeId: chargeId,
      correlationId : correlationId
    };
    // USE OF CONNECTOR CONFUSES ME< IS THIS PUBLIC API< OR THE API MADE JUST FOR THE FRONTEND
    // IF IT IS JUST MADE FOR THE FRONTENT< WHY NOT JUST SEND THE EVENTS TOO?
    connector.withGetCharge(params, function (charge) {
      connector.withChargeEvents(params, function (events) {
        defer.resolve(transactionView.buildPaymentView(charge, events));
      }).on('connectorError', (err, response)=> {
        findWithEventsError(err, response, defer);
      });
    }).on('connectorError', (err, response)=> {
      findWithEventsError(err, response, defer);
    });
    return defer.promise;
  };

  var refund = function (accountId, chargeId, amount, refundAmountAvailable) {
    var defer = q.defer();

    var payload = {
      amount: amount,
      refund_amount_available: refundAmountAvailable
    };

    logger.log('info', 'Submitting a refund for a charge', {
      'chargeId': chargeId,
      'amount': amount,
      'refundAmountAvailable': refundAmountAvailable
    });

    var params = {
      gatewayAccountId: accountId,
      chargeId: chargeId,
      payload: payload,
      correlationId : correlationId
    };
    // IS THE CONNECTOR CONSISTENT WITH CODES, AS IN CAN WE GENERALISE THIS?
    connector.withPostChargeRefund(params, function () {
      defer.resolve();
    }).on('connectorError', (err, response)=> {
      var err = 'REFUND_FAILED';
      if (response && response.statusCode === 400) {
        if (response.body.reason) {
          err = response.body.reason;
        }
      }
      if (response && response.statusCode === 412) {
        if (response.body.reason) {
          err = response.body.reason;
        } else {
          err = "refund_amount_available_mismatch";
        }
      }
      defer.reject(err);
    });

    return defer.promise;
  };

  var findWithEventsError = function (err, response, defer) {
    if (response && response.statusCode === 404) return defer.reject('NOT_FOUND');
    if (response && response.statusCode !== 200) return defer.reject('GET_FAILED');

    defer.reject('CLIENT_UNAVAILABLE');
  };

  return {
    findWithEvents: findWithEvents,
    refund: refund
  };
};
