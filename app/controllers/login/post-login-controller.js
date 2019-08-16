'use strict'

// NPM dependencies
const { createLogger, format, transports } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.Console()
  ]
})
const _ = require('lodash')

// Custom dependencies
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER
const paths = require('../../paths')

/**
 * Reset the login counter for the user, and clean
 * session
 *
 * @param req
 * @param res
 */
module.exports = (req, res) => {
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  req.session = _.pick(req.session, ['passport', 'last_url', 'currentGatewayAccountId'])
  logger.info(`[${correlationId}] successfully attempted username/password combination`)
  res.redirect(paths.user.otpLogIn)
}
