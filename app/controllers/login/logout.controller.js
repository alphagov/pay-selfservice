'use strict'

const _ = require('lodash')

const logger = require('../../utils/logger')(__filename)
const CORRELATION_HEADER = require('../../utils/correlation-header').CORRELATION_HEADER
const userService = require('../../services/user.service')
const router = require('../../routes')

module.exports = (req, res) => {
  if (req.user) {
    userService.logOut(req.user, req.correlationId)
  }

  if (req.session) {
    const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
    logger.info(`[${correlationId}] logged out`)
    req.session.destroy()
  }

  res.redirect(router.paths.user.logIn)
}
