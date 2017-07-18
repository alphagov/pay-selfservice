'use strict'
var appmetrics = require('appmetrics')
var metricsHost = process.env.METRICS_HOST || 'localhost'
var metricsPort = process.env.METRICS_PORT || 8125
var metricsPrefix = 'selfservice.'

function initialiseMonitoring () {
  appmetrics.configure({'mqtt': 'off'})
  var appmetricsStatsd = require('appmetrics-statsd')

  return appmetricsStatsd.StatsD(null, metricsHost, metricsPort, metricsPrefix)
}

module.exports = (function () {
  return {
    metrics: initialiseMonitoring
  }
}())
