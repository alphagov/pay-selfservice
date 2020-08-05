'use strict'

// Custom dependencies
const logger = require('../utils/logger')(__filename)
const { renderErrorView } = require('../utils/response')
const validateInviteService = require('../services/validate-invite.service')
const serviceRegistrationService = require('../services/service-registration.service')
const paths = require('../paths')

// Constants
const messages = {
  missingCookie: 'Unable to process registration at this time',
  internalError: 'Unable to process registration at this time',
  linkExpired: 'This invitation is no longer valid',
  invalidOtp: 'Invalid verification code'
}

const handleError = (req, res, err) => {
  logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`)

  switch (err.errorCode) {
    case 404:
      renderErrorView(req, res, messages.missingCookie, 404)
      break
    case 410:
      renderErrorView(req, res, messages.linkExpired, 410)
      break
    default:
      renderErrorView(req, res, messages.internalError, 500)
  }
}

module.exports = {

  /**
   * Intermediate endpoint which captures the invite code and validate.
   * Upon success this forwards the request to proceed with registration.
   * In case of service invite it also sends the otp verification code.
   *
   * @param req
   * @param res
   * @returns {Promise.<T>}
   */
  validateInvite: (req, res) => {
    const code = req.params.code
    const correlationId = req.correlationId
    const processAndRedirect = (invite) => {
      if (!req.register_invite) {
        req.register_invite = {}
      }

      req.register_invite.code = code

      if (invite.telephone_number) {
        req.register_invite.telephone_number = invite.telephone_number
      }

      if (invite.email) {
        req.register_invite.email = invite.email
      }

      if (invite.type === 'user') {
        req.register_invite.email = invite.email
        const redirectTarget = invite.user_exist ? paths.registerUser.subscribeService : paths.registerUser.registration
        res.redirect(302, redirectTarget)
      } else if (invite.type === 'service') {
        if (invite.user_exist) {
          res.redirect(302, paths.serviceSwitcher.index)
        } else {
          serviceRegistrationService.generateServiceInviteOtpCode(code, correlationId)
            .then(() => {
              res.redirect(302, paths.selfCreateService.otpVerify)
            })
            .catch((err) => {
              handleError(req, res, err)
            })
        }
      } else {
        handleError(req, res, 'Unrecognised invite type')
      }
    }

    return validateInviteService.getValidatedInvite(code, correlationId)
      .then(processAndRedirect)
      .catch((err) => handleError(req, res, err))
  }
}
