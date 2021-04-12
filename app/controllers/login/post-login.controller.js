'use strict'

const _ = require('lodash')

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')

/**
 * Reset the login counter for the user, and clean
 * session
 *
 * @param req
 * @param res
 */
module.exports = (req, res) => {
  req.session = _.pick(req.session, ['passport', 'last_url', 'currentGatewayAccountId'])
  logger.info('Successfully attempted username/password combination')
  res.redirect(paths.user.otpLogIn)
}
