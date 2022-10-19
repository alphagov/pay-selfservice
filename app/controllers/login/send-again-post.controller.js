'use strict'

const userService = require('../../services/user.service')
const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const CORRELATION_HEADER = require('../../utils/correlation-header').CORRELATION_HEADER
const secondFactorMethod = require('../../models/second-factor-method')

module.exports = async function resendOtp (req, res, next) {
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  if (req.user.secondFactor === secondFactorMethod.SMS) {
    try {
      await userService.sendOTP(req.user, correlationId)
      res.redirect(paths.user.otpLogIn)
    } catch (err) {
      next(err)
    }
  } else {
    renderErrorView(req, res, 'You do not use text messages to sign in', 400)
  }
}
