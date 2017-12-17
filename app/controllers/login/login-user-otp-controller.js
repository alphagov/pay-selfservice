'use strict'

// NPM dependencies
const passport = require('passport')

module.exports = (req, res, next) => {
  return passport.authenticate('local2Fa', {
    failureRedirect: '/otp-login',
    badRequestMessage: 'Invalid verification code.',
    failureFlash: true
  })(req, res, next)
}
