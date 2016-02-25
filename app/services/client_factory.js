'use strict';

var fs = require('fs')
  , path = require('path')
  , request = require('request')
  , Client = require('node-rest-client').Client;

const DEFAULT_SSL_DIR = '/etc/ssl/';
const CA_FILE_NAME = 'ca.cert.pem'; // TODO replace the correct cert file name here

module.exports = function () {
  var secureOptions = function () {
    if (process.env.DISABLE_INTERNAL_HTTPS !== "true") {
      var caPath = process.env.SSL_DIR || DEFAULT_SSL_DIR;
      var caFile = path.resolve(caPath + CA_FILE_NAME);
      return {
        ca: fs.readFileSync(caFile),
        secureOptions: 'SSL_OP_NO_TLSv1_2'
      }
    } else {
      return undefined;
    }
  };

  var nodeClientInstance = function () {
    var options = {
      connection: secureOptions() || {}
    };
    return new Client(options);
  };

  var requestClientInstance = function () {
    return request.defaults({
      json: true,
      agentOptions: secureOptions() || {}
    });
  };

  return {
    nodeClientInstance: nodeClientInstance,
    requestClientInstance: requestClientInstance
  }
}();