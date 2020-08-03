'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../utils/logger')(__filename)
const userService = require('../../services/user.service.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  const method = req.body['two-fa-method']
  lodash.set(req, 'session.pageData.twoFactorAuthMethod', method)

  const sendSMS = (method, user) => {
    if (method === 'SMS') {
      return userService.sendProvisonalOTP(user, req.correlationId)
    }
    return Promise.resolve()
  }

  userService.provisionNewOtpKey(req.user.externalId, req.correlationId)
    .then(user => sendSMS(method, user))
    .then(() => {
      return res.redirect(paths.user.twoFactorAuth.configure)
    })
    .catch(err => {
      logger.error(`[requestId=${req.correlationId}] Provisioning new OTP key failed - ${err.message}`)
      req.flash('genericError', `<h2>Internal server error, please try again</h2>`)
      return res.redirect(paths.user.twoFactorAuth.index)
    })
}
