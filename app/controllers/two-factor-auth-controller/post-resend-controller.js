'use strict'

// NPM dependencies
const { createLogger, format } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  )
})

// Local dependencies
const userService = require('../../services/user_service.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  userService.sendProvisonalOTP(req.user, req.correlationId)
    .then(() => {
      req.flash('generic', `<h2>Another security code has been sent to your phone</h2>`)
      return res.redirect(paths.user.twoFactorAuth.configure)
    })
    .catch(err => {
      logger.error(`[requestId=${req.correlationId}] Reseding OTP key SMS failed - ${err.message}`)
      req.flash('genericError', `<h2>Internal server error, please try again</h2>`)
      return res.redirect(paths.user.twoFactorAuth.configure)
    })
}
