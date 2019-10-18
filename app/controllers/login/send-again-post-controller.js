'use strict'

// Custom dependencies
const logger = require('../../utils/logger')(__filename)
const userService = require('../../services/user_service')
const paths = require('../../paths')
const errorView = require('../../utils/response').renderErrorView
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER

module.exports = (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  if (req.user.secondFactor === 'SMS') {
    userService.sendOTP(req.user, correlationId).then(() => {
      res.redirect(paths.user.otpLogIn)
    })
      .catch(err => {
        errorView(req, res)
        logger.error(err)
      })
  } else {
    errorView(req, res, 'You do not use text messages to sign in')
  }
}
