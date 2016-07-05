var Client  = require('node-rest-client').Client;
var client  = new Client();
var q       = require('q');
var _       = require('lodash');
var logger  = require('winston');
var paths   = require('../paths.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var connector = new ConnectorClient(process.env.CONNECTOR_URL);

var transactionView = require('../utils/transaction_view.js');



module.exports = function() {
  'use strict';
  // REMOVE REQUEST GOING THROUGH ONCE WE HAVE REFUNDS
  var findWithEvents = function(accountId, chargeId, req){
    var defer = q.defer();
    connector.withGetCharge(accountId, chargeId, function(charge){
      connector.withChargeEvents(accountId, chargeId, function(events){
        defer.resolve(transactionView.buildPaymentView(charge, events, req));
      }).on('connectorError',(err, response)=> {
        findWithEventsError(err, response, defer);
      });
    }).on('connectorError',(err, response)=> {
      findWithEventsError(err, response, defer);
    });
    return defer.promise;
  },
  // REMOVE FULL REQUEST GOING THROUGH ONCE WE HAVE REFUNDS
  // AND RELY ON THE API AS OPPOSED TO HOKEY SESSION
  refund = function(accountId, chargeId, type, amount, req){
    var defer = q.defer();
    var session = req.session[chargeId];
    if (!req.session[chargeId]) req.session[chargeId] = { refunded_amount : 0 };
    req.session[chargeId].refunded = req.session[chargeId].refunded_amount > 0;

    connector.withGetCharge(accountId, chargeId, function(charge){
      if (type == "full") {
        req.session[chargeId]["refunded_amount"] = charge.amount /100;
        return defer.resolve();
      }

      var netRefund = req.session[chargeId]["refunded_amount"] + parseInt(amount);
      if (netRefund > (charge.amount /100)) {
        return defer.reject('REFUND_FAILED');
      }
      req.session[chargeId]["refunded_amount"] = netRefund;

      defer.resolve();
    });
    return defer.promise;
  };

  var findWithEventsError = function(err, response, defer){
    if (response && response.statusCode === 404) return defer.reject('NOT_FOUND');
    if (response && response.statusCode !== 200) return defer.reject('GET_FAILED');

    defer.reject('CLIENT_UNAVAILABLE');
  };



  return {
    findWithEvents: findWithEvents,
    refund: refund
  };
}();
