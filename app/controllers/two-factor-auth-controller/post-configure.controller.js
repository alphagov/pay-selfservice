'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const userService = require('../../services/user.service.js')

module.exports = async function postUpdateSecondFactorMethod (req, res) {
  const code = req.body['code'] || ''
  const method = lodash.get(req, 'session.pageData.twoFactorAuthMethod', 'APP')
  try {
    await userService.configureNewOtpKey(req.user.externalId, code, method, req.correlationId)
    req.flash('otpMethodUpdated', method)
    return res.redirect(paths.user.profile)
  } catch (err) {
    if (err.errorCode === 401 || err.errorCode === 400) {
      lodash.set(req, 'session.pageData.configureTwoFactorAuthMethodRecovered', {
        errors: {
          verificationCode: 'The verification code you’ve used is incorrect or has expired'
        }
      })
    } else {
      req.flash('genericError', 'Something went wrong. Please try again or contact support.')
      logger.error(`[requestId=${req.correlationId}] Activating new OTP key failed, server error`)
    }
    return res.redirect(paths.user.twoFactorAuth.configure)
  }
}
