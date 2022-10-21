'use strict'

const userService = require('../../services/user.service')
const CORRELATION_HEADER = require('../../utils/correlation-header').CORRELATION_HEADER
const secondFactorMethod = require('../../models/second-factor-method')

module.exports = async function showOtpLogin (req, res, next) {
  const pageData = { secondFactorMethod }
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  pageData.authenticatorMethod = req.user.secondFactor

  if (!req.session.sentCode && req.user.secondFactor === secondFactorMethod.SMS) {
    try {
      await userService.sendOTP(req.user.externalId, correlationId)
      req.session.sentCode = true
      res.render('login/otp-login', pageData)
    } catch (err) {
      next(err)
    }
  } else {
    res.render('login/otp-login', pageData)
  }
}
