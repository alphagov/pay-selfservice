'use strict'

// Local dependencies
const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const pageData = {
    walletsTab: true
  }

  return response(req, res, 'digital-wallet/summary', pageData)
}
