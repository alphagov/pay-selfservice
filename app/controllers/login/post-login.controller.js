'use strict'

const _ = require('lodash')

const logger = require('../../utils/logger')(__filename)
const CORRELATION_HEADER = require('../../utils/correlation-header').CORRELATION_HEADER
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
  if (req.gateway_account) {
    // make sure the accounts external ID is set correctly when the user logs in
    // following this only controlled code (service switcher, redirect controllers) should be able to update the ID
    req.gateway_account.currentGatewayAccountExternalId = req.account && req.account.external_id
  }
  logger.info(`[${correlationId}] successfully attempted username/password combination`)
  res.redirect(paths.user.otpLogIn)
}
