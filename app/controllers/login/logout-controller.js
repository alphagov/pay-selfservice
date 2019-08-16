'use strict'

// NPM dependencies
const { createLogger, format } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  )
})
const _ = require('lodash')

// Custom dependencies
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER
const userService = require('../../services/user_service')
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
