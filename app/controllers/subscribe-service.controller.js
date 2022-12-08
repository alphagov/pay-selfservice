'use strict'

const logger = require('../utils/logger')(__filename)
const { renderErrorView } = require('../utils/response')
const registrationService = require('../services/user-registration.service')
const paths = require('../paths')
const { RegistrationSessionMissingError } = require('../errors')
const { INVITE_SESSION_COOKIE_NAME } = require('../utils/constants')
const { SMS } = require('../models/second-factor-method')

const EXPIRED_ERROR_MESSAGE = 'This invitation is no longer valid'

const subscribeService = async function subscribeService (req, res, next) {
  const sessionData = req[INVITE_SESSION_COOKIE_NAME]
  if (!sessionData || !sessionData.code || !sessionData.email) {
    return next(new RegistrationSessionMissingError())
  }

  const inviteCode = sessionData.code

  if (sessionData.email.toLowerCase() !== req.user.email.toLowerCase()) {
    logger.info('Attempt to accept invite for a different user', {
      invite_code: inviteCode
    })
    return res.redirect(303, paths.serviceSwitcher.index)
  }

  try {
    const completeResponse = await registrationService.completeInvite(inviteCode, SMS)
    req.flash('inviteSuccessServiceId', completeResponse.service_external_id)
    return res.redirect(303, paths.serviceSwitcher.index)
  } catch (err) {
    if (err.errorCode === 410) {
      renderErrorView(req, res, EXPIRED_ERROR_MESSAGE, 410)
    } else {
      next(err)
    }
  }
}

module.exports = {
  subscribeService
}
