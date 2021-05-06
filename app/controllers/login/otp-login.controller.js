'use strict'

const userService = require('../../services/user.service')
const CORRELATION_HEADER = require('../../utils/correlation-header').CORRELATION_HEADER

module.exports = async function showOtpLogin (req, res, next) {
  const PAGE_PARAMS = {}
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  PAGE_PARAMS.authenticatorMethod = req.user.secondFactor

  if (!req.session.sentCode && req.user.secondFactor === 'SMS') {
    try {
      await userService.sendOTP(req.user, correlationId)
      req.session.sentCode = true
      res.render('login/otp-login', PAGE_PARAMS)
    } catch (err) {
      next(err)
    }
  } else {
    res.render('login/otp-login', PAGE_PARAMS)
  }
}
