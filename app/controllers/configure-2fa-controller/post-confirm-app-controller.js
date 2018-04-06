'use strict'

// NPM dependencies
const logger = require('winston')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const userService = require('../../services/user_service.js')
const errorView = require('../../utils/response.js').renderErrorView

module.exports = (req, res) => {
  const code = req.body['code'] || ''
  userService.configureNewOtpKey(req.user.externalId, code, 'APP', req.correlationId)
    .then(user => {
      return response(req, res, 'configure_2fa/complete-app', {})
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Configuring new OTP key failed - ${err.message}`)
      errorView(req, res, 'Security code incorrect')
    })
}
