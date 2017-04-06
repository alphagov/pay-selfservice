"use strict";
let logger = require('winston');
let _ = require('lodash');
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let CustomStrategy = require('passport-custom').Strategy;
let csrf = require('csrf');
let sessionValidator = require(__dirname + '/session_validator.js');
let paths = require(__dirname + '/../paths.js');
let userService = require('./user_service.js');
let CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER;

let localStrategyAuth = function (req, username, password, done) {
  return userService.authenticate(username, password, req.headers[CORRELATION_HEADER] || '')
    .then((user) => done(null, user))
    .catch(() => done(null, false, {message: 'Invalid email or password'}));
};

let localStrategy2Fa = function (req, done) {
  return userService.authenticateSecondFactor(req.user.externalId, req.body.code)
    .then((user) => done(null, user))
    .catch(() => done(null, false, {message: 'Invalid code'}));
};

let ensureSessionHasCsrfSecret = function (req, res, next) {
  if (req.session.csrfSecret) return next();
  req.session.csrfSecret = csrf().secretSync();
  let correlationId = req.headers[CORRELATION_HEADER] || '';
  logger.debug(`[${correlationId}] Saved csrfSecret: ${req.session.csrfSecret}`);

  return next();
};

let ensureSessionHasVersion = function (req) {
  if (!_.get(req, 'session.version', false) !== false) {
    req.session.version = _.get(req, 'user.sessionVersion', 0);
  }
};

let redirectToLogin = function (req, res) {
  req.session.last_url = req.originalUrl;
  res.redirect(paths.user.logIn);
};

let getCurrentGatewayAccountId = function (req) {
  // retrieve currentGatewayAccountId from Cookie
  let currentGatewayAccountId = null;
  if (_.get(req, "gateway_account")) {
    currentGatewayAccountId = _.get(req, "gateway_account.currentGatewayAccountId");
  } else {
    req.gateway_account = {};
  }
  // retrieve user's gatewayAccountIds
  let userGatewayAccountIds = _.get(req, "user.gatewayAccountIds");
  if((!userGatewayAccountIds) || (userGatewayAccountIds.length === 0)) {
    logger.error('Could not resolve the gatewayAccountId for user '); //TODO log the user.id when we have one
    return null;
  }
  // check if we don't have Cookie value
  // or if it's different user  / different userGatewayAccountIds
  if ((!currentGatewayAccountId) ||
      (userGatewayAccountIds.indexOf(currentGatewayAccountId) === -1)) {
    currentGatewayAccountId = userGatewayAccountIds[0];
  }
  // save currentGatewayAccountId and return it
  req.gateway_account.currentGatewayAccountId = currentGatewayAccountId;
  return parseInt(req.gateway_account.currentGatewayAccountId);
};

let enforceUserFirstFactor = function (req, res, next) {
  let hasUser = _.get(req, "user"),
    hasAccount = getCurrentGatewayAccountId(req),
    disabled = _.get(hasUser, "disabled");

  if (!hasUser) return redirectToLogin(req, res);
  if (!hasAccount) return no_access(req, res, next);
  if (disabled === true) return no_access(req, res, next);

  ensureSessionHasCsrfSecret(req, res, next);
};

let no_access = function (req, res, next) {
  if (req.url != paths.user.noAccess) {
    res.redirect(paths.user.noAccess);
  }
  else {
    next(); // don't redirect again if we're already there
  }
};

let enforceUserBothFactors = function (req, res, next) {
  enforceUserFirstFactor(req, res, () => {

    let hasLoggedInOtp = _.get(req, "session.secondFactor") == 'totp';
    if (!hasLoggedInOtp) {
      return res.redirect(paths.user.otpLogIn);
    }

    next();
  });
};

let enforceUserAuthenticated = function (req, res, next) {
  ensureSessionHasVersion(req);

  if (!hasValidSession(req)) {
    return res.redirect(paths.user.logIn);
  }

  enforceUserBothFactors(req, res, next);
};

let hasValidSession = function (req) {
  let isValid = sessionValidator.validate(req.user, req.session);
  let correlationId = req.headers[CORRELATION_HEADER] || '';
  let userSessionVersion = _.get(req, 'user.sessionVersion', 0);
  let sessionVersion = _.get(req, 'session.version', 0);
  if (!isValid) {
    logger.info(`[${correlationId}] Invalid session version for user. User session_version: ${userSessionVersion}, session version ${sessionVersion}`);
  }
  return isValid;
};

let initialise = function (app, override_strategy) {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use('local', new LocalStrategy({usernameField: 'username', passReqToCallback: true}, localStrategyAuth));
  passport.use('local2Fa', new CustomStrategy(localStrategy2Fa));

  passport.serializeUser(this.serializeUser);

  passport.deserializeUser(this.deserializeUser);
};

let deserializeUser = function (req, externalId, done) {
  return userService.findByExternalId(externalId, req.headers[CORRELATION_HEADER] || '')
    .then((user) => {
      done(null, user);
    });
};

let serializeUser = function (user, done) {
  done(null, user.externalId);
};

module.exports = {
  enforceUserFirstFactor: enforceUserFirstFactor,
  enforceUserAuthenticated: enforceUserAuthenticated,
  ensureSessionHasCsrfSecret: ensureSessionHasCsrfSecret,
  initialise: initialise,
  deserializeUser: deserializeUser,
  serializeUser: serializeUser,
  localStrategyAuth: localStrategyAuth,
  no_access: no_access,
  getCurrentGatewayAccountId: getCurrentGatewayAccountId
};
