'use strict'

const logger = require('../../utils/logger')(__filename)
const userService = require('../../services/user.service')
const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const CORRELATION_HEADER = require('../../utils/correlation-header').CORRELATION_HEADER

module.exports = (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  if (req.user.secondFactor === 'SMS') {
    userService.sendOTP(req.user, correlationId).then(() => {
      res.redirect(paths.user.otpLogIn)
    })
      .catch(err => {
        renderErrorView(req, res)
        logger.error(err)
      })
  } else {
    renderErrorView(req, res, 'You do not use text messages to sign in', 400)
  }
}
