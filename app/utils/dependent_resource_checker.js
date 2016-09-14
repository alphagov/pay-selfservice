'use strict';

var sleeper         = require('sleep');
var logger          = require('winston');
var sequelizeConfig = require('../utils/sequelize_config.js');

module.exports = function() {

  var checkDependentResources = function(onResourceAvailable, incrementalWaitDuration, wait) {

    var checkDatabaseConnection = function(startup, attempt) {
      logger.info("Checking for Database connectivity");

      sequelizeConfig.sequelize
        .authenticate()
        .then(function() {
          logger.info('Connection has been established successfully.');
          onResourceAvailable();
        }, function (e) {
          logger.info('Unable to connect to the database: '+ e);
          waitAndCheckDependentResources(startup, attempt, incrementalWaitDuration);
        });
    };

    var waitAndCheckDependentResources = function(startup, attempt, incrementalWaitDuration) {
      var sleepSeconds = attempt * incrementalWaitDuration;
      var timeToSleepInMicroSeconds = sleepSeconds * 1000000;
      logger.info("DB not available. Sleeping for "+ sleepSeconds + " seconds -> attempt "+ attempt);
      sleeper.usleep(timeToSleepInMicroSeconds);
      checkDatabaseConnection(startup, ++attempt);
    };

    checkDatabaseConnection(onResourceAvailable, 1);
  };

  return {
    checkDependentResources: checkDependentResources
  }
}();

