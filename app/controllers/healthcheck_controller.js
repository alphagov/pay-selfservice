const logger = require('winston')
var responseHandler = require('../utils/response.js')

module.exports.healthcheck = function (req, res) {
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  logger.info(`[${correlationId}] successful healthcheck`)
  var data = {'ping': {'healthy': true}}
  responseHandler.healthCheckResponse(req, res, data)
}
