'use strict'

// Local dependencies
const { response } = require('../../utils/response')

module.exports = (req, res) => {
  const isConfigured = Object.keys(req.account.credentials).length !== 0

  return response(req, res, 'your-psp/index', { isConfigured })
}
