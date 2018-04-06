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
  userService.findByExternalId(req.user.externalId, correlationId)
    .then(user => {
      if (user.secondFactor === 'SMS') {
        userService.sendOTP(req.user, correlationId).then(
          () => {
            res.redirect(paths.user.otpLogIn)
          },
          (err) => {
            errorView(req, res)
            logger.error(err)
          }
        )
      } else {
        errorView(req, res, 'You do not use text messages to sign in')
      }
    })
    .catch((err) => {
      logger.error(`[requestId=${correlationId}] Unable to retrieve user - ${err.message}`)
      errorView(req, res, 'Unable to retrieve user')
    })
}
