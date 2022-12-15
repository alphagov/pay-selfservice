'use strict'

const adminusersClient = require('../services/clients/adminusers.client')()
const paths = require('../paths')
const { INVITE_SESSION_COOKIE_NAME } = require('../utils/constants')
const { ExpiredInviteError, NotFoundError } = require('../errors')

/**
 * Intermediate endpoint which captures the invite code and validate.
 * Upon success this forwards the request to proceed with registration.
 * In case of service invite it also sends the otp security code.
 *
 * @param req
 * @param res
 * @returns {Promise.<T>}
 */
async function validateInvite (req, res, next) {
  const code = req.params.code

  try {
    const invite = await adminusersClient.getValidatedInvite(code)
    if (!req[INVITE_SESSION_COOKIE_NAME]) {
      req[INVITE_SESSION_COOKIE_NAME] = {}
    }

    req[INVITE_SESSION_COOKIE_NAME].code = code

    if (invite.email) {
      req[INVITE_SESSION_COOKIE_NAME].email = invite.email
    }

    if (invite.user_exist) {
      if (invite.is_invite_to_join_service) {
        res.redirect(paths.invite.subscribeService)
      } else {
        res.redirect(paths.serviceSwitcher.index)
      }
    } else {
      res.redirect(paths.register.password)
    }
  } catch (err) {
    switch (err.errorCode) {
      case 404:
        return next(new NotFoundError(`Attempted to follow an invite link for invite code ${code}, which was not found`))
      case 410:
        return next(new ExpiredInviteError(`Invite with code ${code} has expired`))
      default:
        next(err)
    }
  }
}

module.exports = {
  validateInvite
}
