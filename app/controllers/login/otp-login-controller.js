'use strict'

// NPM dependencies
const logger = require('winston')

// Custom dependencies
const userService = require('../../services/user_service')
const errorView = require('../../utils/response').renderErrorView
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER

module.exports = (req, res) => {
  let PAGE_PARAMS = {}
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  PAGE_PARAMS.authenticatorMethod = req.user.secondFactor

  if (!req.session.sentCode && req.user.secondFactor === 'SMS') {
    userService.sendOTP(req.user, correlationId).then(function () {
      req.session.sentCode = true
      res.render('login/otp-login', PAGE_PARAMS)
    }, function (err) {
      errorView(req, res)
      logger.error(err)
    }
    )
  } else {
    res.render('login/otp-login', PAGE_PARAMS)
  }
}
