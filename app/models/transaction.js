var Client                  = require('node-rest-client').Client;
var client                  = new Client();
var q                       = require('q');
var _                       = require('lodash');
var logger                  = require('winston');
var paths                   = require('../paths.js');
var ConnectorClient         = require('../services/clients/connector_client.js').ConnectorClient;

module.exports = function(correlationId) {
  'use strict';

  correlationId = correlationId || '';

  var connectorClient = function(){
    return new ConnectorClient(process.env.CONNECTOR_URL);
  },

  successfulSearch = function(data, response, defer) {
    var error = response.statusCode !== 200;
    if (error) return defer.reject(new Error('GET_FAILED'));
    defer.resolve(data);
  },

  clientUnavailable = function(error, defer, correlationId) {
    logger.error(`[${correlationId}] Calling connector to search transactions for an account threw exception -`, {
      service: 'connector',
      method: 'GET',
      error: error
    });
    defer.reject(new Error('CLIENT_UNAVAILABLE'), error);
  },

  /**
   *
   * @param accountID
   * @param filters
   * @returns {*}
   */
  search = function(accountID, filters){
    var defer = q.defer();
    var params = filters;
    params.gatewayAccountId = accountID;
    params.correlationId = correlationId;

    connectorClient().searchTransactions(params, function(data, response) {
        successfulSearch(data, response, defer);
    }).on('connectorError',function(err, connectorResponse){
        if (connectorResponse) return defer.reject(new Error('GET_FAILED'));
        clientUnavailable(err, defer, correlationId);
      });

    return defer.promise;
  },

  /**
   *
   * @param accountID
   * @param filters
   * @returns {*}
   */
  searchAll = function(accountID, filters){
    var defer = q.defer();
    var params = filters;
    params.gatewayAccountId = accountID;
    params.correlationId = correlationId;
    var success = function(results){ defer.resolve({results: results }); };

    connectorClient().getAllTransactions(params, success)
      .on('connectorError', function(err, connectorResponse){
        if (connectorResponse) return defer.reject(new Error('GET_FAILED'));
        clientUnavailable(err, defer, correlationId);
      });

    return defer.promise;
  };

  return {
    search: search,
    searchAll: searchAll
  };
};
