var Client                  = require('node-rest-client').Client;
var client                  = new Client();
var q                       = require('q');
var _                       = require('lodash');
var logger                  = require('winston');
var paths                   = require('../paths.js');
var ConnectorClient         = require('../services/connector_client.js').ConnectorClient;
var headers                 = { "Accept": "application/json" };
var withCorrelationHeader   = require('../utils/correlation_header.js').withCorrelationHeader;


module.exports = function(correlationId) {

  'use strict';
  var connector = new ConnectorClient(process.env.CONNECTOR_URL);
  
  correlationId = correlationId || '';

  var allGatewaysUrl = function(){
    return connector.allGatewaysUrl();
  },
  
  clientUnavailable = function(error, defer, correlationId) {
    logger.error(`[${correlationId}] Calling connector to retrieve gateway accounts for an account threw exception -`, {
      service: 'connector',
      method: 'GET',
      error: error
    });
    defer.reject(new Error('CLIENT_UNAVAILABLE'), error);
  },

  all = function(){
    var defer = q.defer(),
    startTime = new Date();
    client.get(allGatewaysUrl(), withCorrelationHeader({}, correlationId), function(data, response) {
      logger.info(`[${correlationId}] - GET to %s ended - elapsed time: %s ms`, allGatewaysUrl(),  new Date() - startTime);
      var error = response.statusCode !== 200;
      if (error) return defer.reject(new Error('GET_FAILED'));
      return defer.resolve(data.accounts);
    }).on('error',function(err){
      logger.info(`[${correlationId}] - GET error  to %s ended - elapsed time: %s ms`, allGatewaysUrl(),  new Date() - startTime);
      clientUnavailable(err, defer, correlationId);
    });
    return defer.promise
  }


  return {
    all: all,
  };
};
