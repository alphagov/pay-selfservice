var logger = require('winston');
var CORRELATION_HEADER = require('./correlation_header.js').CORRELATION_HEADER;

const ERROR_MESSAGE = 'There is a problem with the payments platform';
const NOT_FOUND = 'Page cannot be found';

function response(accept, res, template, data) {
  if (accept === "application/json") {
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } else {
    res.render(template, data);
  }
}

function healthCheckResponse(accept, res, data) {
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
}

module.exports = {
  ERROR_MESSAGE: ERROR_MESSAGE,
  ERROR_VIEW: 'error',
  PAGE_NOT_FOUND_ERROR_MESSAGE: NOT_FOUND,

  response: response,
  healthCheckResponse: healthCheckResponse,

  renderErrorView: function (req, res, msg) {
    if (!msg) msg = ERROR_MESSAGE;
    var correlationId = req.headers[CORRELATION_HEADER] ||'';
    logger.error(`[${correlationId}] An error has occurred. Rendering error view -`, {errorMessage: msg});

    var accept = (req && req.headers) ? req.headers.accept : "";
    response(accept, res, 'error', {
      'message': msg
    });
  }
};
