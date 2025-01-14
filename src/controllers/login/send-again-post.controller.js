'use strict'

const userService = require('../../services/user.service')
const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const secondFactorMethod = require('../../models/second-factor-method')

module.exports = async function resendOtp (req, res, next) {
  if (req.user.secondFactor === secondFactorMethod.SMS) {
    try {
      await userService.sendOTP(req.user.externalId)
      res.redirect(paths.user.otpLogIn)
    } catch (err) {
      next(err)
    }
  } else {
    renderErrorView(req, res, 'You do not use text messages to sign in', 400)
  }
}
