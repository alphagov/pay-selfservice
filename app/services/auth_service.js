"use strict";
var logger = require('winston');
var _ = require('lodash');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var TotpStrategy = require('passport-totp').Strategy;
var csrf = require('csrf');
var sessionValidator = require(__dirname + '/session_validator.js');
var paths = require(__dirname + '/../paths.js');
var userService = require('./user_service.js');
var CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER;

var localStrategyAuth = function (req, username, password, done) {
  return userService.authenticate(username, password, req.headers[CORRELATION_HEADER] || '')
    .then((user) => done(null, user))
    .catch(() => done(null, false, {message: 'Invalid username or password'}));
};

var ensureSessionHasCsrfSecret = function (req, res, next) {
  if (req.session.csrfSecret) return next();
  req.session.csrfSecret = csrf().secretSync();
  var correlationId = req.headers[CORRELATION_HEADER] || '';
  logger.debug(`[${correlationId}] Saved csrfSecret: ${req.session.csrfSecret}`);

  return next();
};

var ensureSessionHasVersion = function (req) {
  if (!_.get(req, 'session.version', false) !== false) {
    req.session.version = _.get(req, 'user.sessionVersion', 0);
  }
};

var redirectToLogin = function (req, res) {
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

var enforceUserFirstFactor = function (req, res, next) {
  var hasUser = _.get(req, "user"),
    hasAccount = getCurrentGatewayAccountId(req),
    disabled = _.get(hasUser, "disabled");

  if (!hasUser) return redirectToLogin(req, res);
  if (!hasAccount) return no_access(req, res, next);
  if (disabled === true) return no_access(req, res, next);

  ensureSessionHasCsrfSecret(req, res, next);
};

var no_access = function (req, res, next) {
  if (req.url != paths.user.noAccess) {
    res.redirect(paths.user.noAccess);
  }
  else {
    next(); // don't redirect again if we're already there
  }
};

var enforceUserBothFactors = function (req, res, next) {

  enforceUserFirstFactor(req, res, () => {

    var hasLoggedInOtp = _.get(req, "session.secondFactor") == 'totp';
    if (!hasLoggedInOtp) {
      return res.redirect(paths.user.otpLogIn);
    }

    next();
  });
};

var enforceUserAuthenticated = function (req, res, next) {
  ensureSessionHasVersion(req);

  if (!hasValidSession(req)) {
    return res.redirect(paths.user.logIn);
  }

  enforceUserBothFactors(req, res, next);
};

var hasValidSession = function (req) {
  var isValid = sessionValidator.validate(req.user, req.session);
  var correlationId = req.headers[CORRELATION_HEADER] || '';
  var userSessionVersion = _.get(req, 'user.sessionVersion', 0);
  var sessionVersion = _.get(req, 'session.version', 0);
  if (!isValid) {
    logger.info(`[${correlationId}] Invalid session version for user. User session_version: ${userSessionVersion}, session version ${sessionVersion}`);
  }
  return isValid;
};

var initialise = function (app, override_strategy) {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use('local', new localStrategy({usernameField: 'username', passReqToCallback: true}, localStrategyAuth));
  passport.use(new TotpStrategy(
    function (user, done) {
      return done(null, user.otpKey, 30);
    }
  ));

  passport.serializeUser(this.serializeUser);

  passport.deserializeUser(this.deserializeUser);
};

var deserializeUser = function (req, username, done) {
  return userService.findByUsername(username, req.headers[CORRELATION_HEADER] || '')
    .then((user) => {
      done(null, user);
    });
};

var serializeUser = function (user, done) {
  done(null, user.username);
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
