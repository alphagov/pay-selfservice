'use strict'

// NPM dependencies
const logger = require('winston')

// Custom dependencies
const userService = require('../../services/user_service')
const paths = require('../../paths')
const errorView = require('../../utils/response').renderErrorView
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER

module.exports = (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  userService.sendOTP(req.user, correlationId).then(
    () => {
      res.redirect(paths.user.otpLogIn)
    },
    (err) => {
      errorView(req, res)
      logger.error(err)
    }
  )
}
