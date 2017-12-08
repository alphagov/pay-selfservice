'use strict'

// NPM dependencies
const logger = require('winston')

// Custom dependencies
const userService = require('../../services/user_service')
const errorView = require('../../utils/response').renderErrorView
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER

module.exports = (req, res) => {
  if (!req.session.sentCode) {
    const correlationId = req.headers[CORRELATION_HEADER] || ''
    userService.sendOTP(req.user, correlationId).then(function () {
      req.session.sentCode = true
      res.render('login/otp-login')
    }, function (err) {
      errorView(req, res)
      logger.error(err)
    }
    )
  } else {
    res.render('login/otp-login')
  }
}
