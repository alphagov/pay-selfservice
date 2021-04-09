'use strict'

const lodash = require('lodash')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const CustomStrategy = require('passport-custom').Strategy
const { addLoggingField } = require('../utils/log-context')
const { USER_EXTERNAL_ID } = require('@govuk-pay/pay-js-commons').logging.keys

// TODO: Remove when issue solved
/*
 This is in because otherwise the correlationID stored in using the correlation-id library gets lost while passing through one of the
 functions in this file. When we have either stopped this happening, or have removed usage of the correlation-id library,
 we can remove this
 */
require('correlation-id')

const logger = require('../utils/logger')(__filename)
const sessionValidator = require('./session-validator.js')
const paths = require('../paths.js')
const userService = require('./user.service.js')
const CORRELATION_HEADER = require('../utils/correlation-header.js').CORRELATION_HEADER

// Exports
module.exports = {
  enforceUserFirstFactor,
  lockOutDisabledUsers,
  initialise,
  deserializeUser,
  serializeUser,
  localStrategyAuth,
  localDirectStrategy,
  noAccess,
  setSessionVersion,
  redirectLoggedInUser
}

// Middleware
function lockOutDisabledUsers (req, res, next) {
  if (req.user && req.user.disabled) {
    logger.info('User locked out due to many password attempts')
    return noAccess(req, res, next)
  }
  return next()
}

function enforceUserFirstFactor (req, res, next) {
  let hasUser = lodash.get(req, 'user')
  let disabled = lodash.get(hasUser, 'disabled')

  if (!hasUser) return redirectToLogin(req, res)
  if (disabled === true) return noAccess(req, res, next)

  return next()
}

function noAccess (req, res, next) {
  if (req.url !== paths.user.noAccess) {
    res.redirect(paths.user.noAccess)
  } else {
    next() // don't redirect again if we're already there
  }
}

function redirectLoggedInUser (req, res, next) {
  if (hasValidSession(req)) {
    return res.redirect(paths.index)
  }
  next()
}

// Other Methods
function localStrategyAuth (req, username, password, done) {
  return userService.authenticate(username, password, req.headers[CORRELATION_HEADER] || '')
    .then((user) => done(null, user))
    .catch(() => done(null, false, { message: 'Invalid email or password' }))
}

function localStrategy2Fa (req, done) {
  return userService.authenticateSecondFactor(req.user.externalId, req.body.code, req.correlationId)
    .then((user) => done(null, user))
    .catch(() => done(null, false, { message: 'The verification code you’ve used is incorrect or has expired.' }))
}

function localDirectStrategy (req, done) {
  return userService.findByExternalId(req.register_invite.userExternalId, req.headers[CORRELATION_HEADER] || '')
    .then((user) => {
      lodash.set(req, 'gateway_account.currentGatewayAccountId', lodash.get(user, 'serviceRoles[0].service.gatewayAccountIds[0]'))
      req.session.secondFactor = 'totp'
      setSessionVersion(req)
      req.register_invite.destroy()
      done(null, user)
    })
    .catch(() => {
      req.register_invite.destroy()
      done(null, false)
    })
}

function setSessionVersion (req) {
  req.session.version = lodash.get(req, 'user.sessionVersion', 0)
}

function redirectToLogin (req, res) {
  req.session.last_url = req.originalUrl
  logger.info(`Redirecting attempt to access ${req.originalUrl} to ${paths.user.logIn}`)
  res.redirect(paths.user.logIn)
}

function hasValidSession (req) {
  const isValid = sessionValidator.validate(req.user, req.session)
  if (!isValid) logger.info(`Invalid session version for user. User session_version: ${lodash.get(req, 'user.sessionVersion', 0)}, session version ${lodash.get(req, 'session.version')}`)
  return isValid
}

function addUserFieldsToLogContext (req, res, next) {
  if (req.user) {
    addLoggingField(USER_EXTERNAL_ID, req.user.externalId)
    addLoggingField('internal_user', req.user.internalUser)
  }
  next()
}

function initialise (app) {
  app.use(passport.initialize())
  app.use(passport.session())
  passport.use('local', new LocalStrategy({ usernameField: 'username', passReqToCallback: true }, localStrategyAuth))
  passport.use('local2Fa', new CustomStrategy(localStrategy2Fa))
  passport.use('localDirect', new CustomStrategy(localDirectStrategy))
  passport.serializeUser(serializeUser)
  passport.deserializeUser(deserializeUser)
  app.use(addUserFieldsToLogContext)
}

function deserializeUser (req, externalId, done) {
  return userService.findByExternalId(externalId, req.headers[CORRELATION_HEADER] || '')
    .then((user) => {
      done(null, user)
    })
    .catch(err => {
      logger.info(`Failed to retrieve user, '${externalId}', from adminusers with statuscode: ${err.errorCode}`)
      done(err)
    })
}

function serializeUser (user, done) {
  done(null, user && user.externalId)
}
