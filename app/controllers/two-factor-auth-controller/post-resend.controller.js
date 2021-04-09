'use strict'

const logger = require('../../utils/logger')(__filename)
const userService = require('../../services/user.service.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  userService.sendProvisionalOTP(req.user, req.correlationId)
    .then(() => {
      req.flash('generic', 'Another verification code has been sent to your phone')
      return res.redirect(paths.user.profile.twoFactorAuth.configure)
    })
    .catch(err => {
      logger.error(`Reseding OTP key SMS failed - ${err.message}`)
      req.flash('genericError', 'Something went wrong. Please try again or contact support.')
      return res.redirect(paths.user.profile.twoFactorAuth.configure)
    })
}
