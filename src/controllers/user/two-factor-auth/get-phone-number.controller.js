'use strict'

const { response } = require('../../../utils/response.js')

module.exports = function showPhoneNumberPage (req, res) {
  return response(req, res, 'two-factor-auth/phone-number')
}
