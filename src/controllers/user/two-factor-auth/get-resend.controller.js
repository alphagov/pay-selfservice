'use strict'

const { response } = require('../../../utils/response.js')

module.exports = function showResendSmsCodePage (req, res) {
  return response(req, res, 'two-factor-auth/resend-sms-code', { phone: req.user.telephoneNumber })
}
