'use strict'
const appmetrics = require('appmetrics')
const metricsHost = process.env.METRICS_HOST || 'localhost'
const metricsPort = process.env.METRICS_PORT || 8125
const metricsPrefix = 'selfservice.'

function initialiseMonitoring () {
  appmetrics.configure({ mqtt: 'off' })
  const appmetricsStatsd = require('appmetrics-statsd')

  return appmetricsStatsd.StatsD(metricsHost, metricsPort, metricsPrefix)
}

module.exports = (function () {
  return {
    metrics: initialiseMonitoring
  }
}())
