'use strict';
var path    = require('path');
var fs      = require('fs');
var opts    = require('https').globalAgent.options;
var logger  = require('winston');

module.exports = function () {
  var use = function () {
    var certsPath = process.env.CERTS_PATH || __dirname + '/../../certs';
    try {
      if (!fs.lstatSync(certsPath).isDirectory()) {
        logger.error('Provided CERTS_PATH is not a directory', {
          'certsPath': certsPath
        });
        return;
      }
    }
    catch (e) {
      logger.error('Provided CERTS_PATH could not be read', {
        'certsPath': certsPath
      });
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
