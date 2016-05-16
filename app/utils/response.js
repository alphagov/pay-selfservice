var logger = require('winston');

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
  ERROR_MESSAGE : 'There is a problem with the payments platform',
  ERROR_VIEW : 'error',
  PAGE_NOT_FOUND_ERROR_MESSAGE : 'Page cannot be found',

  response : response,
  healthCheckResponse: healthCheckResponse,

  renderErrorView : function (req, res, msg) {
    logger.error('An error occurred: ' + msg);
    response(req.headers.accept, res, 'error', {
      'message': msg
    });
  }
};
