'use strict'

// NPM dependencies
const lodash = require('lodash')
const logger = require('winston')

// Local dependencies
const userService = require('../../services/user_service.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  const method = req.body['two-fa-method']
  lodash.set(req, 'session.pageData.twoFactorAuthMethod', method)

  const sendSMS = (method, user) => {
    return new Promise((resolve, reject) => {
      if (method === 'SMS') {
        userService.sendProvisonalOTP(user, req.correlationId)
          .then(() => resolve())
          .catch(err => reject(err))
      }
      return resolve()
    })
  }

  userService.provisionNewOtpKey(req.user.externalId, req.correlationId)
    .then(user => sendSMS(method, user))
    .then(user => {
      return res.redirect(paths.user.twoFactorAuth.configure)
    })
    .catch(err => {
      logger.error(`[requestId=${req.correlationId}] Provisioning new OTP key failed - ${err.message}`)
      req.flash('genericError', `<h2>Internal server error, please try again</h2>`)
      return res.redirect(paths.user.twoFactorAuth.index)
    })
}
