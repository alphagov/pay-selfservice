'use strict'

const _ = require('lodash')

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')

module.exports = (req, res) => {
  req.session = _.pick(req.session, ['passport', 'last_url', 'currentGatewayAccountId'])
  logger.info('Successfully attempted username/password combination')

  if (req.user.mfas && req.user.mfas.length > 1) {
    res.redirect(paths.user.chooseOtp)
  } else {
    res.redirect(paths.user.otpLogIn)
  }
}
