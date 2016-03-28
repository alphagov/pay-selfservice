'use strict';

var path = require('path');
var fs   = require('fs');
var opts = require('https').globalAgent.options;

module.exports = function () {
  var use = function () {
    var certsPath = process.env.CERTS_PATH || __dirname + '/../../certs';
    opts.ca = opts.ca || [];
    var certs = fs.readdirSync(certsPath).forEach( 
      (certPath) => opts.ca.push(
        fs.readFileSync(path.join(certsPath, certPath))
      )
    );
  };
  
  return {
    use: use
  };
}();
