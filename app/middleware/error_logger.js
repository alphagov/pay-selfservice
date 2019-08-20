'use strict'

// NPM dependencies
const logger = require('../utils/logger')

module.exports = function (err, req, res, next) {
  let errorPayload = {
    request: {
      originalUrl: req.originalUrl,
      url: req.url
    }
  }
  if (typeof err === 'object') {
    errorPayload.error = {
      message: err.message,
      stack: err.stack
    }
  } else {
    errorPayload.error = {
      message: err
    }
  }

  // log the exception
  logger.error({ message: `Internal server error`, requestId: req.correlationId })
  // re-throw it
  next(err)
}
