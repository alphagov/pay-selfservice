'use strict'

const logger = require('../../utils/logger')(__filename)
const userService = require('../../services/user_service')
const { renderErrorView } = require('../../utils/response')
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
        renderErrorView(req, res)
        logger.error(err)
      })
  } else {
    res.render('login/otp-login', PAGE_PARAMS)
  }
}
