'use strict'

const logger = require('../utils/logger')(__filename)
const adminusersClient = require('../services/clients/adminusers.client')()
const paths = require('../paths')
const { INVITE_SESSION_COOKIE_NAME } = require('../utils/constants')
const { SMS } = require('../models/second-factor-method')
const { ExpiredInviteError } = require('../errors')

const subscribeService = async function subscribeService (req, res, next) {
  const sessionData = req[INVITE_SESSION_COOKIE_NAME]

  const inviteCode = sessionData.code

  if (sessionData.email.toLowerCase() !== req.user.email.toLowerCase()) {
    logger.info('Attempt to accept invite for a different user', {
      invite_code: inviteCode
    })
    return res.redirect(303, paths.serviceSwitcher.index)
  }

  try {
    const completeResponse = await adminusersClient.completeInvite(inviteCode, SMS)
    req.flash('inviteSuccessServiceId', completeResponse.service_external_id)
    return res.redirect(303, paths.serviceSwitcher.index)
  } catch (err) {
    if (err.errorCode === 410) {
      return next(new ExpiredInviteError(`Invite with code ${sessionData.code} has expired`))
    } else {
      next(err)
    }
  }
}

module.exports = {
  subscribeService
}
