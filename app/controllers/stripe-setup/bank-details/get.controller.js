'use strict'

const { response } = require('../../../utils/response')

module.exports = (req, res) => {
  return response(req, res, 'stripe-setup/bank-details/index')
}
