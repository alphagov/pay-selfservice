'use strict'

// NPM Dependencies
const csrf = require('csrf')

// Local Dependencies
const logger = require('../utils/logger')(__filename)
const { renderErrorView } = require('../utils/response.js')
const CORRELATION_HEADER = require('../utils/correlation-header.js').CORRELATION_HEADER

// Assignments and Variables
const errorMsg = 'There is a problem with the payments platform'

// Exports
module.exports = {
  validateAndRefreshCsrf,
  ensureSessionHasCsrfSecret
}

// Middleware methods
function validateAndRefreshCsrf (req, res, next) {
  let session = req.session
  if (!session) {
    logger.warn('Session is not defined')
    return renderErrorView(req, res, errorMsg, 400)
  }

  if (!session.csrfSecret) {
    logger.warn('CSRF secret is not defined for session')
    return renderErrorView(req, res, errorMsg, 400)
  }

  if (req.method !== 'GET' && !isValidCsrf(req)) {
    logger.warn('CSRF secret provided is invalid')
    return renderErrorView(req, res, errorMsg, 400)
  }

  res.locals.csrf = csrf().create(session.csrfSecret)
  next()
}

function ensureSessionHasCsrfSecret (req, res, next) {
  if (req.session.csrfSecret) return next()
  req.session.csrfSecret = csrf().secretSync()
  let correlationId = req.headers[CORRELATION_HEADER] || ''
  logger.debug(`[${correlationId}] Saved csrfSecret: ${req.session.csrfSecret}`)

  return next()
}

// Other Methods
function isValidCsrf (req) {
  return csrf().verify(req.session.csrfSecret, req.body.csrfToken)
}
