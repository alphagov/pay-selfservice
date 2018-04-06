'use strict'

// NPM dependencies
const logger = require('winston')

// Custom dependencies
const userService = require('../../services/user_service')
const errorView = require('../../utils/response').renderErrorView
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER

module.exports = (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  userService.findByExternalId(req.user.externalId, correlationId)
    .then(user => {
      const PAGE_PARAMS = {}
      switch (user.secondFactor) {
        case 'SMS':
          PAGE_PARAMS.usesSmsToSignIn = true;
          PAGE_PARAMS.usesAppToSignIn = false;
          break;
        case 'APP':
          PAGE_PARAMS.usesSmsToSignIn = false;
          PAGE_PARAMS.usesAppToSignIn = true;
      }
      if (!req.session.sentCode && user.secondFactor === 'SMS') {
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
    })
    .catch((err) => {
      logger.error(`[requestId=${correlationId}] Unable to retrieve user - ${err.message}`)
      errorView(req, res, 'Unable to retrieve user')
    })


}
