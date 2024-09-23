'use strict'

const lodash = require('lodash')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const CustomStrategy = require('passport-custom').Strategy
const { addField } = require('../services/clients/base/request-context')
const { USER_EXTERNAL_ID } = require('@govuk-pay/pay-js-commons').logging.keys

const logger = require('../utils/logger')(__filename)
const sessionValidator = require('./session-validator.js')
const paths = require('../paths.js')
const userService = require('./user.service.js')
const { validationErrors } = require('./../utils/validation/field-validation-checks')
const secondFactorMethod = require('../models/second-factor-method')
const { validateOtp } = require('../utils/validation/server-side-form-validations')
const { sanitiseSecurityCode } = require('../utils/security-code-utils')
const { INVITE_SESSION_COOKIE_NAME } = require('../utils/constants')

// Exports
module.exports = {
  enforceUserFirstFactor,
  initialise,
  deserializeUser,
  serializeUser,
  localStrategyAuth,
  localStrategy2Fa,
  localStrategyLoginDirectAfterRegistration,
  noAccess,
  setSessionVersion,
  redirectLoggedInUser
}

// Middleware

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
  return userService.authenticate(username, password)
    .then((user) => done(null, user))
    .catch(() => done(null, false, { message: 'Invalid email or password' }))
}

async function localStrategy2Fa (req, done) {
  const code = sanitiseSecurityCode(req.body.code)
  const validationResult = validateOtp(code)
  if (!validationResult.valid) {
    return done(null, false, { message: validationResult.message })
  }
  try {
    const user = await userService.authenticateSecondFactor(req.user.externalId, code)
    done(null, user)
  } catch (err) {
    const message = req.user.secondFactor === secondFactorMethod.SMS
      ? validationErrors.invalidOrExpiredSecurityCodeSMS
      : validationErrors.invalidOrExpiredSecurityCodeApp
    done(null, false, { message })
  }
}

async function localStrategyLoginDirectAfterRegistration (req, done) {
  const registrationSession = req[INVITE_SESSION_COOKIE_NAME]
  try {
    if (!(registrationSession && registrationSession.userExternalId)) {
      return done(null, false)
    }

    const user = await userService.findByExternalId(registrationSession.userExternalId)
    req.session.secondFactor = 'totp'
    setSessionVersion(req)
    registrationSession.destroy()
    done(null, user)
  } catch (err) {
    registrationSession.destroy()
    done(null, false)
  }
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
    addField(USER_EXTERNAL_ID, req.user.externalId)
    addField('internal_user', req.user.internalUser)
  }
  next()
}

function initialise (app) {
  app.use(passport.initialize())
  app.use(passport.session())
  passport.use('local', new LocalStrategy({ usernameField: 'username', passReqToCallback: true }, localStrategyAuth))
  passport.use('local2Fa', new CustomStrategy(localStrategy2Fa))
  passport.use('localStrategyLoginDirectAfterRegistration', new CustomStrategy(localStrategyLoginDirectAfterRegistration))
  passport.serializeUser(serializeUser)
  passport.deserializeUser(deserializeUser)
  app.use(addUserFieldsToLogContext)
}

function deserializeUser (req, externalId, done) {
  return userService.findByExternalId(externalId)
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
