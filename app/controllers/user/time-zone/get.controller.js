'use strict'

const { response } = require('../../../utils/response.js')

module.exports = (req, res) => {
  return response(req, res, 'time-zone/index', {
    timeZone: req.user.timeZone
  })
}
