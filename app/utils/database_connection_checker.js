'use strict';

var Sequelize  = require('sequelize');
var logger     = require('winston');

module.exports = function() {
  var dbConnectionCheck = function(req, res, data, success, fail) {

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

    console.log("in db check");
    console.log(sequelize);

    sequelize.authenticate()
      .then(function() {
        logger.info('Connection has been established successfully.');
        success(req, res, data);
      }, function () {
        logger.warn('Unable to connect to the database');
        fail(req, res, data);
      });
  };

  return {
    dbConnectionCheck: dbConnectionCheck
  }
}();
