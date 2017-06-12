'use strict';

// NPM dependencies
const logger = require('winston');
// Custom dependencies
const env = require('../../env');
const renderErrorView = require('../utils/response').renderErrorView;

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
  logger.error(`[requestId=${req.correlationId}] Internal server error -`, errorPayload);
  if (env.isProduction()) {
    renderErrorView(req, res, 'Sorry, something went wrong', 200);
  } else {
    next(err);
  }
};
