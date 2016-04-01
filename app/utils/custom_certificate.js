'use strict';

var path = require('path');
var fs   = require('fs');
var opts = require('https').globalAgent.options;

var logger = require('winston');

module.exports = function () {
  var use = function () {
    var certsPath = process.env.CERTS_PATH || __dirname + '/../../certs';
    
    try {
      if (!fs.lstatSync(certsPath).isDirectory()) {
        logger.warn('Provided CERTS_PATH ' + certsPath + ' is not a directory');
        return;
      }
    }
    catch (e) {
      logger.warn('Provided CERTS_PATH ' + certsPath + ' could not be read');
      return;
    }
    
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
