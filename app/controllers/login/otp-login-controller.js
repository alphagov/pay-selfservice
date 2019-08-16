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

// Custom dependencies
const userService = require('../../services/user_service')
const errorView = require('../../utils/response').renderErrorView
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER

module.exports = (req, res) => {
  const PAGE_PARAMS = {}
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  PAGE_PARAMS.authenticatorMethod = req.user.secondFactor

  if (!req.session.sentCode && req.user.secondFactor === 'SMS') {
    userService.sendOTP(req.user, correlationId).then(() => {
      req.session.sentCode = true
      res.render('login/otp-login', PAGE_PARAMS)
    })
      .catch(err => {
        errorView(req, res)
        logger.error(err)
      })
  } else {
    res.render('login/otp-login', PAGE_PARAMS)
  }
}
