'use strict';

var appmetrics = require("appmetrics-statsd");

function initialiseMonitoring () {
  console.log("Initialising....");

  return appmetrics.StatsD(null, "localhost", 8125, 'selfservice.')
}

module.exports = function() {

  return {
    metrics: initialiseMonitoring()
  }
}();
