var path = require('path');
var fs   = require('fs');

var logger = require('winston');

module.exports = {
  addCertsToAgent: function (agent) {
    var certsPath = process.env.CERTS_PATH || __dirname + '/../../certs';

    try {
      if (!fs.lstatSync(certsPath).isDirectory()) {
        logger.error('Provided CERTS_PATH is not a directory', {
          certsPath: certsPath
        });
        return;
      }
    }
    catch (e) {
      logger.error('Provided CERTS_PATH could not be read', {
        certsPath: certsPath
      });
      return;
    }

    agent.options.ca = agent.options.ca || [];
    var certs = fs.readdirSync(certsPath).forEach(
      (certPath) => agent.options.ca.push(
        fs.readFileSync(path.join(certsPath, certPath))
      )
    );
  }
};
