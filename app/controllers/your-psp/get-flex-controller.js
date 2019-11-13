'use strict'

// Local dependencies
const { response } = require('../../utils/response')

module.exports = (req, res) => {
  const { change } = req.query || {}
  return response(req, res, 'your-psp/flex', { change })
}
