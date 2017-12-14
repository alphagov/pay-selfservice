'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')

// Custom dependencies
const {setSessionVersion} = require('../../services/auth_service')
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER

module.exports = (req, res) => {
  req.session.secondFactor = 'totp'
  const redirectUrl = req.session.last_url || '/'
  delete req.session.last_url
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  logger.info(`[${correlationId}] successfully entered a valid 2fa token`)
  setSessionVersion(req)
  res.redirect(redirectUrl)
}
