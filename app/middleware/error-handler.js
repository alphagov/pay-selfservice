'use strict'

const logger = require('../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const {
  NotAuthenticatedError,
  UserAccountDisabledError,
  NotAuthorisedError,
  NotFoundError
} = require('../errors')
const paths = require('../paths')
const { CORRELATION_HEADER } = require('../utils/correlation-header')
const { renderErrorView } = require('../utils/response')

module.exports = function errorHandler (err, req, res, next) {
  const logContext = {}
  logContext[keys.CORRELATION_ID] = req.headers[CORRELATION_HEADER]

  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof NotAuthenticatedError) {
    if (req.session) {
      req.session.last_url = req.originalUrl
    }
    logger.info(`Redirecting attempt to access ${req.originalUrl} to ${paths.user.logIn}`, logContext)
    return res.redirect(paths.user.logIn)
  }

  if (err instanceof UserAccountDisabledError) {
    res.status(401)
    return res.render('login/noaccess')
  }

  if (err instanceof NotAuthorisedError) {
    return renderErrorView(req, res, 'You do not have the administrator rights to perform this operation.', 403)
  }

  if (err instanceof NotFoundError) {
    res.status(404)
    return res.render('404')
  }

  logContext.stack = err.stack
  logger.error(`Unhandled error caught: ${err.message}`, logContext)
  renderErrorView(req, res, 'There is a problem with the payments platform. Please contact the support team.', 500)
}
