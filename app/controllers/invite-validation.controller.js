'use strict'

const { renderErrorView } = require('../utils/response')
const validateInviteService = require('../services/validate-invite.service')
const serviceRegistrationService = require('../services/service-registration.service')
const paths = require('../paths')

/**
 * Intermediate endpoint which captures the invite code and validate.
 * Upon success this forwards the request to proceed with registration.
 * In case of service invite it also sends the otp verification code.
 *
 * @param req
 * @param res
 * @returns {Promise.<T>}
 */
async function validateInvite (req, res, next) {
  const code = req.params.code

  try {
    const invite = await validateInviteService.getValidatedInvite(code)
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
        await serviceRegistrationService.generateServiceInviteOtpCode(code)
        res.redirect(302, paths.selfCreateService.otpVerify)
      }
    } else {
      next(new Error('Unrecognised invite type'))
    }
  } catch (err) {
    switch (err.errorCode) {
      case 404:
        renderErrorView(req, res, 'There has been a problem proceeding with this registration. Please try again.', 404)
        break
      case 410:
        renderErrorView(req, res, 'This invitation is no longer valid', 410)
        break
      default:
        next(err)
    }
  }
}

module.exports = {
  validateInvite
}
