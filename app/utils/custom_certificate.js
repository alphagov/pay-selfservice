'use strict';

var path = require('path');
var fs   = require('fs');
var opts = require('https').globalAgent.options;

module.exports = function () {

  var use = function () {
    var caFilePath = process.env.CA_FILEPATH || '/etc/ssl/ca.cert.pem';

    var caFile = fs.readFileSync(path.resolve(caFilePath));

    opts.ca = opts.ca || [];
    opts.secureOptions = 'SSL_OP_NO_TLSv1_2';
    opts.ca.push(caFile);
  };

  return {
    use: use
  };

}();