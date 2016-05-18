var Client  = require('node-rest-client').Client;
var client  = new Client();
var q       = require('q');
var logger  = require('winston');
var paths   = require('../paths.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var headers = { "Accept": "application/json" };

module.exports = function() {
  'use strict';

  var searchUrl = function(accountID, filters){
    var connector = new ConnectorClient(process.env.CONNECTOR_URL);
    return connector.withSearchTransactions(accountID, filters);
  },

  search = function(accountID, filters){
    var defer = q.defer();
    var url = searchUrl(accountID, filters);
    client.get(url, { headers: headers }, function(data, response) {
      successfulSearch(data, response, defer);
    }).on('error',function(err){
      clientUnavailable(err, defer);
    });
    return defer.promise;
  },

  successfulSearch = function(data, response, defer) {
    var error = response.statusCode !== 200;
    if (error) return defer.reject(new Error('GET_FAILED'));
    defer.resolve(data);
  },

  clientUnavailable = function(error, defer) {
    logger.error('Exception raised calling connector for del: ' + error);
    defer.reject(new Error('CLIENT_UNAVAILABLE'), error);
  };

  return {
    search: search
  };
}();
