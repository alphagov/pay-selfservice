'use strict'

const { response } = require('../utils/response')

module.exports.get = function (req, res) {
  return response(req, res, 'policy/stripe-terms-and-conditions/stripe-terms-and-conditions')
}
