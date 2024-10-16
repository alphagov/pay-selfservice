const responseHandler = require('../utils/response.js')

module.exports.healthcheck = function (req, res) {
  const data = { ping: { healthy: true } }
  responseHandler.healthCheckResponse(req, res, data)
}
