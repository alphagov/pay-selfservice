'use strict';

// NPM dependencies
const logger = require('winston');

module.exports = function(err, req, res, next) {
  let errorPayload = {
    request: {
      originalUrl: req.originalUrl,
      url: req.url
    }
  };
  if (typeof err === 'object') {
    errorPayload.error = {
      message: err.message,
      stack: err.stack
    };
  } else {
    errorPayload.error = {
      message: err
    };
  }

  // log the exception
  logger.error(`[requestId=${req.correlationId}] Internal server error -`, errorPayload);
  // re-throw it
  next(err);
};
