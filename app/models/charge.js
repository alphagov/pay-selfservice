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
  var findWithEvents = function(accountId, chargeId){
    var defer = q.defer();
    connector.withGetCharge(accountId, chargeId, function(charge){
      connector.withChargeEvents(accountId, chargeId, function(events){
        defer.resolve(transactionView.buildPaymentView(charge, events));
      }).on('connectorError',(err, response)=> {
        connectorError(err, response, defer);
      });
    }).on('connectorError',(err, response)=> {
      connectorError(err, response, defer);
    });
    return defer.promise;
  };

  var connectorError = function(err, response, defer){
    if (response && response.statusCode === 404) return defer.reject('NOT_FOUND');
    if (response && response.statusCode !== 200) return defer.reject('GET_FAILED');

    defer.reject('CLIENT_UNAVAILABLE');
  };



  return {
    findWithEvents: findWithEvents
  };
}();
