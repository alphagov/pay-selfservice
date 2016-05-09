var logger          = require('winston');
var responseHandler = require('../utils/response.js');
var Sequelize       = require('sequelize');

module.exports.healthcheck = function (req, res) {
  var data = {'ping': {'healthy': true}, 'database': {'healthy': true}};

  var sequelize = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD, {
      "dialect": "postgres",
      "host": process.env.DATABASE_HOST,
      "port": process.env.DATABASE_PORT,
      "logging": false,
      "ssl": true,
      "native": true
    }
  );

  sequelize
    .authenticate()
    .then(function(err) {
      logger.info('Connection has been established successfully.');
      responseHandler.response(req.headers.accept, res, null, data);
    }, function (err) {
      logger.warn('Unable to connect to the database:', err);
      data.database.healthy = false;
      res.status(503);
      responseHandler.response(req.headers.accept, res, null, data);
    });
};

module.exports.bindRoutesTo = function (app) {
};
