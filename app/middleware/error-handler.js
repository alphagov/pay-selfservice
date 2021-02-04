'use strict'

const logger = require('../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const {
  NotAuthenticatedError,
  UserAccountDisabledError,
  NotAuthorisedError,
  PermissionDeniedError,
  NoServicesWithPermissionError,
  NotFoundError
} = require('../errors')
const paths = require('../paths')
const { CORRELATION_HEADER } = require('../utils/correlation-header')
const { renderErrorView, response } = require('../utils/response')

module.exports = function errorHandler (err, req, res, next) {
  const logContext = {}
  logContext[keys.CORRELATION_ID] = req.headers[CORRELATION_HEADER]
  if (req.user) {
    logContext[keys.USER_EXTERNAL_ID] = req.user.externalId
  }
  if (req.service) {
    logContext[keys.SERVICE_EXTERNAL_ID] = req.service.externalId
  }
  if (req.account) {
    logContext[keys.GATEWAY_ACCOUNT_ID] = req.account.gateway_account_id
  }

  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof NotAuthenticatedError) {
    if (req.session) {
      req.session.last_url = req.originalUrl
    }
    logger.info(`NotAuthenticatedError handled: ${err.message}. Redirecting attempt to access ${req.originalUrl} to ${paths.user.logIn}`, logContext)
    return res.redirect(paths.user.logIn)
  }

  if (err instanceof UserAccountDisabledError) {
    logger.info('UserAccountDisabledError handled, rendering no access page', logContext)
    res.status(401)
    return res.render('login/noaccess')
  }

  if (err instanceof NotAuthorisedError) {
    logger.info(`NotAuthorisedError handled: ${err.message}. Rendering error page`, logContext)
    return renderErrorView(req, res, 'You do not have the rights to access this service.', 403)
  }

  if (err instanceof PermissionDeniedError) {
    logger.info(`PermissionDeniedError handled: ${err.message}. Rendering error page`, logContext)
    return renderErrorView(req, res, 'You do not have the administrator rights to perform this operation.', 403)
  }

  if (err instanceof NoServicesWithPermissionError) {
    logger.info(`NoServicesWithPermissionError handled: ${err.message}. Rendering error page`, logContext)
    return renderErrorView(req, res, err.message, 403)
  }

  if (err instanceof NotFoundError) {
    logger.info(`NotFoundError handled: ${err.message}. Rendering 404 page`, logContext)
    res.status(404)
    return response(req, res, '404')
  }

  if (err && err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF secret provided is invalid')
    return renderErrorView(req, res, 'There is a problem with the payments platform. Please contact the support team', 400)
  }

  logContext.stack = err.stack
  logger.error(`Unhandled error caught: ${err.message}`, logContext)
  renderErrorView(req, res, 'There is a problem with the payments platform. Please contact the support team.', 500)
}
