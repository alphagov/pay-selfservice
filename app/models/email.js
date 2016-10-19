var Client                      = require('node-rest-client').Client;
var client                      = new Client();
var q                           = require('q');
var _                           = require('lodash');
var logger                      = require('winston');
var paths                       = require('../paths.js');
var headers                     = { "Content-Type": "application/json" };
var EMAIL_NOTIFICATION_API_PATH = '/v1/api/accounts/{accountId}/email-notification';
var withCorrelationHeader       = require('../utils/correlation_header.js').withCorrelationHeader;

var connectorUrl = function(accountID){
  // CENTRALISE URL GENERATION
    return process.env.CONNECTOR_URL + EMAIL_NOTIFICATION_API_PATH.replace("{accountId}", accountID);
  };

module.exports = function(correlationId){

  correlationId = correlationId || '';

  var get = function(accountID){
    var defer = q.defer();
    // CENTRALISE DATE LOGGIN
    var startTime = new Date();
    var args = {headers: headers};

    client.get(connectorUrl(accountID), withCorrelationHeader(args, correlationId), function(data, response) {
      // CENTRALISE LOGGING
      logger.info(`[${correlationId}] - GET to %s ended - elapsed time: %s ms`, connectorUrl(accountID),  new Date() - startTime);
      var error = response.statusCode !== 200;
      if (error) {
        return defer.reject(new Error('GET_FAILED'));
      }
      defer.resolve({
        customEmailText: data.template_body,
        emailEnabled: data.enabled
      });
    }).on('error',function(err){
      logger.info(`[${correlationId}] - GET to %s ended - elapsed time: %s ms`, connectorUrl(accountID),  new Date() - startTime);
      clientUnavailable(err, defer, 'GET', correlationId);
    });
    return defer.promise;
  };

  var update = function(accountID,emailText){
    var defer = q.defer();
    // CENTRALISE LOGGING
    var startTime = new Date();
    var args = {headers: headers, data: {"custom-email-text": emailText} };

    client.post(connectorUrl(accountID),withCorrelationHeader(args, correlationId), function(data, response) {
      // CENTRALISE LOGGING
      logger.info(`[${correlationId}] - POST to %s ended - elapsed time: %s ms`, connectorUrl(accountID),  new Date() - startTime);
      // AGAIN COULD MAYBE BE GENERALISED
      var error = response.statusCode !== 200;
      if (error) return defer.reject(new Error('POST_FAILED'));
      defer.resolve();
    }).on('error',function(err){
      // CENTRALISE LOGGING
      logger.info(`[${correlationId}] - POST to %s ended - elapsed time: %s ms`, connectorUrl(accountID),  new Date() - startTime);
      clientUnavailable(err, defer, 'POST', correlationId);
    });
    return defer.promise;
  };

  var setEnabled = function(accountID,enabled) {
    var defer = q.defer();
    // CENTRALISE LOGGING
    logger.debug('model',connectorUrl(accountID),{"op": "replace", "path": "enabled", "value": enabled});
    // CENTRALISE LOGGING
    var startTime = new Date();
    var args = {headers: headers, data: {"op": "replace", "path": "enabled", "value": enabled} };

    client.patch(connectorUrl(accountID), withCorrelationHeader(args, correlationId), function(data, response) {
      // CENTRALISE LOGGING
      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID),  new Date() - startTime);
      // COULD PROBABLY BE GENERALISED
      var error = response.statusCode !== 200;
      if (error) return defer.reject(new Error('PATCH_FAILED'));
      defer.resolve();
    }).on('error',function(err){
      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID),  new Date() - startTime);
      clientUnavailable(err, defer, 'PATCH', correlationId);
    });
    return defer.promise;
  };


  var clientUnavailable = function(error, defer, methodType, correlationId) {
    // CENTRALISE LOGGING
    logger.error(`[${correlationId}] Calling connector to email notification for an account threw exception -`, {
      service: 'connector',
      method: methodType,
      error: error
    });
    defer.reject(new Error('CLIENT_UNAVAILABLE'), error);
  };


  return {
    get: get,
    update: update,
    setEnabled: setEnabled
  };

};
