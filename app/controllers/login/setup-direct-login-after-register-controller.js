'use strict'

// NPM dependencies
const logger = require('winston')

module.exports = (req, res, userExternalId) => {
  if (!userExternalId) {
    const correlationId = req.correlationId
    logger.error(`[requestId=${correlationId}] unable to log user in directly after registration. missing user external id in req`)
    res.redirect(303, '/login')
    return
  }

  req.register_invite.userExternalId = userExternalId
}
