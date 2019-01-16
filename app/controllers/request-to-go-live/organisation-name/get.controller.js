'use strict'

// Local dependencies
const goLiveStage = require('../../../models/go-live-stage')
const response = require('../../../utils/response')

module.exports = (req, res) => {
  return response.response(
    req,
    res,
    'request-to-go-live/organisation-name',
    {
      goLiveStage
    }
  )
}
