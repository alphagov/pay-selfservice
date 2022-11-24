'use strict'

const { INVITE_SESSION_COOKIE_NAME } = require('../../utils/constants')
const logger = require('../../utils/logger')(__filename)

module.exports = (req, res, userExternalId) => {
  if (!userExternalId) {
    logger.error('Unable to log user in directly after registration. Missing user external id in req')
    res.redirect(303, '/login')
    return
  }

  req[INVITE_SESSION_COOKIE_NAME].userExternalId = userExternalId
}
