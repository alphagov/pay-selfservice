'use strict'

const logger = require('../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { CORRELATION_HEADER } = require('../utils/correlation-header')
const { renderErrorView } = require('../utils/response')

const UNHANDLED_ERROR_MESSAGE = 'There is a problem with the payments platform. Please contact the support team.'
const UNHANDLED_ERROR_STATUS = 500

module.exports = function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  const logContext = {
    // trim the stack as long log messages are truncated by Splunk
    stack: err.stack.substring(0, 300),
  }
  logContext[keys.CORRELATION_ID] = req.headers[CORRELATION_HEADER]
  logger.error(`Unhandled error caught: ${err.message}`, logContext)
  renderErrorView(req, res, UNHANDLED_ERROR_MESSAGE, UNHANDLED_ERROR_STATUS)
}
