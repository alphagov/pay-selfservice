var Client  = require('node-rest-client').Client;
var client  = new Client();
var q       = require('q');
var _       = require('lodash');
var logger  = require('winston');
var paths   = require('../paths.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var headers = { "Accept": "application/json" };

module.exports = function(){
  // temporaraily store on sessions, remove req once we can
  var get = function(req){
    var defer = q.defer();
    setTimeout(function(){
      defer.resolve(req.session.emailNotification);
    },400);
    return defer.promise;
  };

  // temporaraily store on sessions, remove req once we can
  var update = function(req,emailText){
    var defer = q.defer();
    setTimeout(function(){
      req.session.emailNotification = emailText;
      defer.resolve();
    },400);
    return defer.promise;
  };

  return {
    get: get,
    update: update
  };

}();
