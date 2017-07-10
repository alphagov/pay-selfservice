'use strict'

// NPM dependencies
const logger = require('winston')

// Custom dependencies
const paths = require('../paths')
const errorResponse = require('../utils/response').renderErrorView;
const registrationService = require('../services/service_registration_service')
const {validateOtp} = require('../utils/registration_validations')

// Exports
module.exports = {
  verifyOtpForServiceInvite
}

// Middleware methods

/**
 * Process submission of otp verification
 *
 * @param req
 * @param res
 * @param next
 * @returns {*|Promise|Promise.<T>}
 */
function verifyOtpForServiceInvite (req, res, next) {
  const correlationId = req.correlationId
  const code = req.register_invite.code
  const otpCode = req.body['verify-code']

  const handleInvalidOtp = (message) => {
    logger.debug(`[requestId=${correlationId}] invalid user input - otp code`)
    req.flash('genericError', message)
    res.redirect(303, paths.selfCreateService.otpVerify)
  }

  return validateOtp(otpCode)
    .then(() => registrationService.submitServiceInviteOtpCode(code, otpCode, correlationId))
    .then(next)
    .catch(err => {
      logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`)
      switch (err.errorCode) {
        case undefined:
          handleInvalidOtp(err)
          break
        case 401:
          handleInvalidOtp('Invalid verification code')
          break
        case 404:
          errorResponse(req, res, 'Unable to process registration at this time', 404)
          break
        case 410:
          errorResponse(req, res, 'This invitation is no longer valid', 410)
          break
        default:
          errorResponse(req, res, 'Unable to process registration at this time', 500)
      }
    })
}