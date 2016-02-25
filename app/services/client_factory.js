'use strict'
var fs = require('fs')
  , path = require('path')
  , Client = require('node-rest-client').Client;

module.exports = function () {

  var nodeClientInstance = function () {
    var options = {};
    if (process.env.DISABLE_INTERNAL_HTTPS !== "true") {
      var caFile = path.resolve(process.env.SSL_DIR + 'ca.cert.pem'); // TODO replace the correct cert file name here
      options = {
        connection: {
          ca: fs.readFileSync(caFile),
          secureOptions: 'SSL_OP_NO_TLSv1_2'
        }
      };
    }
    return new Client(options);

  };

  return {
    nodeClientInstance: nodeClientInstance
  }
}();