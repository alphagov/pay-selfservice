'use strict'

const logger = require('../../utils/logger')(__filename)
const userService = require('../../services/user.service.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  userService.sendProvisonalOTP(req.user, req.correlationId)
    .then(() => {
      req.flash('generic', `<h2>Another verification code has been sent to your phone</h2>`)
      return res.redirect(paths.user.twoFactorAuth.configure)
    })
    .catch(err => {
      logger.error(`[requestId=${req.correlationId}] Reseding OTP key SMS failed - ${err.message}`)
      req.flash('genericError', `<h2>Internal server error, please try again</h2>`)
      return res.redirect(paths.user.twoFactorAuth.configure)
    })
}
