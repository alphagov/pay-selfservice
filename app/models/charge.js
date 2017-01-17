var Client = require('node-rest-client').Client;
var client = new Client();
var q = require('q');
var _ = require('lodash');
var logger = require('winston');
var paths = require('../paths.js');
var ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient;
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

    connector.getCharge(params, function (charge) {
      connector.getChargeEvents(params, function (events) {
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

    connector.postChargeRefund(params, function () {
      defer.resolve();
    }).on('connectorError', (err, response, body)=> {
      var err = 'REFUND_FAILED';
      if (response && response.statusCode === 400) {
        if (body.reason) {
          err = body.reason;
        }
      }
      if (response && response.statusCode === 412) {
        if (body.reason) {
          err = body.reason;
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
