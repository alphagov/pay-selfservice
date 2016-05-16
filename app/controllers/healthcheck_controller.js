var logger          = require('winston');
var responseHandler = require('../utils/response.js');
var sequelizeConfig = require('../utils/sequelize_config.js');

module.exports.healthcheck = function (req, res) {
  var data = {'ping': {'healthy': true}, 'database': {'healthy': true}};

   sequelizeConfig.sequelize
    .authenticate()
    .then(function(err) {
      logger.info('Connection has been established successfully.');
      responseHandler.healthCheckResponse(req.headers.accept, res, data);
    }, function (err) {
      logger.warn('Unable to connect to the database:', err);
      data.database.healthy = false;
      res.status(503);
      responseHandler.healthCheckResponse(req.headers.accept, res, data);
    });
};
