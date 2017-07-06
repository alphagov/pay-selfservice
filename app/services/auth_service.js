'use strict'

// NPM Dependencies
const logger = require('winston')
const lodash = require('lodash')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const CustomStrategy = require('passport-custom').Strategy

// Local Dependencies
const sessionValidator = require('./session_validator.js')
const paths = require('../paths.js')
const userService = require('./user_service.js')
const csrf = require('../middleware/csrf')
const CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER

// Exports
module.exports = {
  enforceUserFirstFactor,
  enforceUserAuthenticated,
  lockOutDisabledUsers,
  initialise,
  deserializeUser,
  serializeUser,
  localStrategyAuth,
  localDirectStrategy,
  noAccess,
  getCurrentGatewayAccountId,
  setSessionVersion
}

// Middleware
function lockOutDisabledUsers (req, res, next) {
  if (req.user && req.user.disabled) {
    const correlationId = req.headers[CORRELATION_HEADER] || ''
    logger.info(`[${correlationId}] user: ${lodash.get(req, 'user.externalId')} locked out due to many password attempts`)
    return noAccess(req, res, next)
  }
  return next()
}

function enforceUserFirstFactor (req, res, next) {
  const hasUser = lodash.get(req, 'user')
  const disabled = lodash.get(hasUser, 'disabled')

  if (!hasUser) return redirectToLogin(req, res)
  if (disabled === true) return noAccess(req, res, next)
  csrf.ensureSessionHasCsrfSecret(req, res, next)
}

function noAccess (req, res, next) {
  if (req.url !== paths.user.noAccess) {
    res.redirect(paths.user.noAccess)
  } else {
    next() // don't redirect again if we're already there
  }
}

function enforceUserBothFactors (req, res, next) {
  enforceUserFirstFactor(req, res, () => {
    let hasLoggedInOtp = lodash.get(req, 'session.secondFactor') === 'totp'
    if (!hasLoggedInOtp) {
      return res.redirect(paths.user.otpLogIn)
    }

    next()
  })
}

function enforceUserAuthenticated (req, res, next) {
  if (!hasValidSession(req)) {
    return redirectToLogin(req, res)
  }
  enforceUserBothFactors(req, res, next)
}

// Other Methods
function localStrategyAuth (req, username, password, done) {
  return userService.authenticate(username, password, req.headers[CORRELATION_HEADER] || '')
    .then((user) => done(null, user))
    .catch(() => done(null, false, {message: 'Invalid email or password'}))
}

function localStrategy2Fa (req, done) {
  return userService.authenticateSecondFactor(req.user.externalId, req.body.code)
    .then((user) => done(null, user))
    .catch(() => done(null, false, {message: 'Invalid code'}))
}

function localDirectStrategy (req, done) {
  return userService.findByExternalId(req.register_invite.userExternalId, req.headers[CORRELATION_HEADER] || '')
    .then((user) => {
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
  res.redirect(paths.user.logIn)
}

function getCurrentGatewayAccountId (req) {
  // retrieve currentGatewayAccountId from Cookie
  let currentGatewayAccountId = null
  if (lodash.get(req, 'gateway_account')) {
    currentGatewayAccountId = lodash.get(req, 'gateway_account.currentGatewayAccountId')
  } else {
    req.gateway_account = {}
  }
  // retrieve user's gatewayAccountIds
  let userGatewayAccountIds = lodash.get(req, 'user.gatewayAccountIds')
  if ((!userGatewayAccountIds) || (userGatewayAccountIds.length === 0)) {
    logger.error(`Could not resolve the gatewayAccountId for user: ${lodash.get(req, 'user.externalId')}`)
    return null
  }
  // check if we don't have Cookie value
  // or if it's different user  / different userGatewayAccountIds
  if ((!currentGatewayAccountId) ||
    (userGatewayAccountIds.indexOf(currentGatewayAccountId) === -1)) {
    currentGatewayAccountId = userGatewayAccountIds[0]
  }
  // save currentGatewayAccountId and return it
  req.gateway_account.currentGatewayAccountId = currentGatewayAccountId
  return parseInt(req.gateway_account.currentGatewayAccountId)
}

function hasValidSession (req) {
  let isValid = sessionValidator.validate(req.user, req.session)
  let correlationId = req.headers[CORRELATION_HEADER] || ''
  let userSessionVersion = lodash.get(req, 'user.sessionVersion', 0)
  let sessionVersion = lodash.get(req, 'session.version', 0)
  if (!isValid) {
    logger.info(`[${correlationId}] Invalid session version for user. User session_version: ${userSessionVersion}, session version ${sessionVersion}`)
  }
  return isValid
}

function initialise (app) {
  app.use(passport.initialize())
  app.use(passport.session())
  passport.use('local', new LocalStrategy({usernameField: 'username', passReqToCallback: true}, localStrategyAuth))
  passport.use('local2Fa', new CustomStrategy(localStrategy2Fa))
  passport.use('localDirect', new CustomStrategy(localDirectStrategy))

  passport.serializeUser(this.serializeUser)

  passport.deserializeUser(this.deserializeUser)
}

function deserializeUser (req, externalId, done) {
  return userService.findByExternalId(externalId, req.headers[CORRELATION_HEADER] || '')
    .then((user) => {
      done(null, user)
    })
}

function serializeUser (user, done) {
  done(null, user.externalId)
}
