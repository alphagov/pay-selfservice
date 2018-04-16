'use strict'

// NPM dependencies
const logger = require('winston')

// Local dependencies
const userService = require('../../services/user_service.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  userService.provisionNewOtpKey(req.user.externalId, req.correlationId)
    .then(user => {
      return res.redirect(paths.user.twoFactorAuth.configure)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Provisioning new OTP key failed - ${err.message}`)
      req.flash('genericError', `<h2>Internal server error, please try again</h2>`)
      return res.redirect(paths.user.twoFactorAuth.index)
    })
}
