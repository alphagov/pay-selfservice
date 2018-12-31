'use strict'

// Local dependencies
const response = require('../../../utils/response')

module.exports = (req, res) => {
  // TODO: finish the UI implementation and logic
  const externalServiceId = req.service.externalId
  return response.response(req, res, 'request-to-go-live/index', {externalServiceId})
}
