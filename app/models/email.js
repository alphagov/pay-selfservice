var Client  = require('node-rest-client').Client;
var client  = new Client();
var q       = require('q');
var _       = require('lodash');
var logger  = require('winston');
var paths   = require('../paths.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var headers = { "Content-Type": "application/json" };
var EMAIL_NOTIFICATION_API_PATH       = '/v1/api/accounts/{accountId}/email-notification';

var connectorUrl = function(accountID){
    return process.env.CONNECTOR_URL + EMAIL_NOTIFICATION_API_PATH.replace("{accountId}", accountID);
  };

module.exports = function(){
  var get = function(accountID){
    var defer = q.defer();
    client.get(connectorUrl(accountID), {headers: headers}, function(data, response) {
      var error = response.statusCode !== 200;
      if (error) {
        return defer.reject(new Error('GET_FAILED'));
      }
      defer.resolve(data.template_body);
    }).on('error',function(err){
      clientUnavailable(err, defer, 'GET');
    });
    return defer.promise;
  };

  var update = function(accountID,emailText){
    var defer = q.defer();
    client.post(connectorUrl(accountID), {headers: headers, data: {"custom-email-text": emailText} }, function(data, response) {
      var error = response.statusCode !== 200;
      if (error) return defer.reject(new Error('POST_FAILED'));
      defer.resolve();
    }).on('error',function(err){
      clientUnavailable(err, defer, 'POST');
    });
    return defer.promise;
  };

  var clientUnavailable = function(error, defer, methodType) {
    logger.error('Calling connector to email notification for an account threw exception -', {
      service: 'connector',
      method: methodType,
      error: error
    });
    defer.reject(new Error('CLIENT_UNAVAILABLE'), error);
  };
  return {
    get: get,
    update: update
  };

}();
