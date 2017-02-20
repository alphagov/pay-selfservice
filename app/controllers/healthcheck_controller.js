var responseHandler = require('../utils/response.js');

module.exports.healthcheck = function (req, res) {
  var data = {'ping': {'healthy': true}};
  responseHandler.healthCheckResponse(req, res, data);
};
