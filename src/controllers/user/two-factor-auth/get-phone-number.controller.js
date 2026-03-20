'use strict'

const { response } = require('../../../utils/response')

module.exports = function showPhoneNumberPage(req, res) {
  return response(req, res, 'two-factor-auth/phone-number')
}
