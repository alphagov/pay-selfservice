'use strict'

const logger = require('../../utils/logger')(__filename)
const userService = require('../../services/user.service')
const router = require('../../routes')

module.exports = (req, res) => {
  if (req.user) {
    userService.logOut(req.user.externalId, req.correlationId)
  }

  if (req.session) {
    logger.info('Logged out')
    req.session.destroy()
  }

  res.redirect(router.paths.user.logIn)
}
