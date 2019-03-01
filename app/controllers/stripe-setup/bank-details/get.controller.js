'use strict'

// Local dependencies
const response = require('../../../utils/response')

module.exports = (req, res) => {
  return response.response(req, res, 'stripe-setup/bank-details/index')
}
