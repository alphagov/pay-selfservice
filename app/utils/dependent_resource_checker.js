'use strict';

var sleeper         = require('sleep');
var sequelizeConfig = require('../utils/sequelize_config.js');

module.exports = function() {
  
  var checkDependentResources = function(onResourceAvailable, incrementalWaitDuration, wait) {

    var checkDatabaseConnection = function(startup, attempt) {
      console.log("Checking for Database connectivity");

      sequelizeConfig.sequelize
        .authenticate()
        .then(function() {
          console.log('Connection has been established successfully.');
          onResourceAvailable();
        }, function () {
          console.log('Unable to connect to the database');
          waitAndCheckDependentResources(startup, attempt, incrementalWaitDuration);
        });
    };

    var waitAndCheckDependentResources = function(startup, attempt, incrementalWaitDuration) {
      var sleepSeconds = attempt * incrementalWaitDuration;
      var timeToSleepInMicroSeconds = sleepSeconds * 1000000;
      console.log("DB not available. Sleeping for "+ sleepSeconds + " seconds -> attempt "+ attempt);
      sleeper.usleep(timeToSleepInMicroSeconds);
      checkDatabaseConnection(startup, ++attempt);
    };

    checkDatabaseConnection(onResourceAvailable, 1);
  };

  return {
    checkDependentResources: checkDependentResources
  }
}();

