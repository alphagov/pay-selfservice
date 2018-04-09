'use strict'

// NPM dependencies
const logger = require('winston')

// Local dependencies
const paths = require('../../paths')
const userService = require('../../services/user_service.js')

module.exports = (req, res) => {
  const code = req.body['code'] || ''
  userService.configureNewOtpKey(req.user.externalId, code, 'APP', req.correlationId)
    .then(user => {
      req.flash('generic', `<h2>Your two factor authentication method has been&nbsp;updated</h2><p>Next time you sign in please use your configured authenticator app</p>`)
      return res.redirect(paths.user.profile)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Configuring new OTP key failed - ${err.message}`)
      req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#code">Please enter a valid security code</a></li></ul>`)
      return res.redirect(paths.user.twoFactorAuth.configure)
    })
}
