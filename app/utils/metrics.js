'use strict';

var appmetrics = require("appmetrics-statsd");

function initialiseMonitoring () {
  const opts = {
    "host": "localhost",
    "port": 8125,
    "prefix": "selfservice."
  };
  console.log("Initialising....");

  return appmetrics.StatsD(opts)
}

module.exports = function() {

  return {
    metrics: initialiseMonitoring()
  }
}();
