'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const userService = require('../../services/user.service.js')

module.exports = (req, res) => {
  const code = req.body['code'] || ''
  const method = lodash.get(req, 'session.pageData.twoFactorAuthMethod', 'APP')
  userService.configureNewOtpKey(req.user.externalId, code, method, req.correlationId)
    .then(user => {
      if (method === 'APP') {
        req.flash('generic', `Your sign-in method has been updated. Use your authenticator app when you next sign in.`)
      } else {
        req.flash('generic', `Your sign-in method has been updated. We’ll send you a text message when you next sign in.`)
      }
      return res.redirect(paths.user.profile)
    })
    .catch((err) => {
      let errorMessage
      if (err.errorCode === 401 || err.errorCode === 400) {
        errorMessage = `<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#code">Please enter a valid verification code</a></li></ul>`
      } else {
        errorMessage = 'Something went wrong. Please try again or contact support.'
        logger.error(`[requestId=${req.correlationId}] Activating new OTP key failed, server error`)
      }
      req.flash('genericError', errorMessage)
      return res.redirect(paths.user.twoFactorAuth.configure)
    })
}
