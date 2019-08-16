'use strict'

const { createLogger, format, transports } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.Console()
  ]
})

const { renderErrorView } = require('../utils/response')

const UNHANDLED_ERROR_MESSAGE = 'There is a problem with the payments platform. Please contact the support team.'
const UNHANDLED_ERROR_STATUS = 500

module.exports = function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  logger.error('Unhandled error caught - ' + err.stack)
  renderErrorView(req, res, UNHANDLED_ERROR_MESSAGE, UNHANDLED_ERROR_STATUS)
}
