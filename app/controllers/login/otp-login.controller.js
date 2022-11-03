'use strict'

const userService = require('../../services/user.service')
const secondFactorMethod = require('../../models/second-factor-method')

module.exports = async function showOtpLogin (req, res, next) {
  const pageData = { secondFactorMethod }
  pageData.authenticatorMethod = req.user.secondFactor

  if (!req.session.sentCode && req.user.secondFactor === secondFactorMethod.SMS) {
    try {
      await userService.sendOTP(req.user.externalId)
      req.session.sentCode = true
      res.render('login/otp-login', pageData)
    } catch (err) {
      next(err)
    }
  } else {
    res.render('login/otp-login', pageData)
  }
}
