var logger          = require('winston');
var responseHandler = require('../utils/response.js');
var sequelizeConfig = require('../utils/sequelize_config.js');

var migrated = false;

module.exports.healthcheck = function (req, res) {
  var data = {'ping': {'healthy': true}, 'database': {'healthy': true}};
  
  sequelizeConfig.sequelize
    .authenticate()
    .then(function (err) {
      logger.debug('Connection has been established successfully');
      
      // ensure all migrations complete before returning good healthchecks
      if (!migrated) {
        logger.info("Checking models/migrations...")
        sequelizeConfig.sequelize.sync().then(function() {
          migrated = true;
        }).catch(function(err) {
          logger.error("Could not complete sequelize sync", {'err': err});
        });
        
        data.database.healthy = false;
        res.status(503);
        responseHandler.healthCheckResponse(req.headers.accept, res, data);
      }
      else {
        data.database.healthy = true;
        responseHandler.healthCheckResponse(req.headers.accept, res, data);
      }
    }, function (err) {
      logger.error('Unable to connect to the database -', {'err': err});
      data.database.healthy = false;
      res.status(503);
      responseHandler.healthCheckResponse(req.headers.accept, res, data);
    });
};
