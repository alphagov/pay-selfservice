'use strict';

let logger = require('winston');
let renderErrorView = require('../utils/response.js').renderErrorView;

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
  renderErrorView(req, res, 'Sorry, something went wrong', 200);
};
