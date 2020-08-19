'use strict'
const { renderErrorView } = require('../utils/response.js')
const { getEmailSettings } = require('../services/email.service.js')
const _ = require('lodash')
const CORRELATION_HEADER = require('../utils/correlation-header.js').CORRELATION_HEADER

module.exports = function (req, res, next) {
  const correlationId = req.headers[CORRELATION_HEADER]
  return getEmailSettings(req.account.gateway_account_id, correlationId)
    .then(emailData => {
      req.account = _.merge(req.account, emailData)
      next()
    })
    .catch(() => renderErrorView(req, res))
}
