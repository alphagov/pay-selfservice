"use strict";
var logger = require('winston');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var TotpStrategy = require('passport-totp').Strategy;
var paths = require(__dirname + '/../paths.js');
var csrf = require('csrf');
var User = require(__dirname + '/../models/user.js');
var _ = require('lodash');
var CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER;

var localStrategyAuth = function (username, password, done) {
  User.authenticate(username,password)
  .then(function(user){
    done(null, user);
  },function(){
    done(null, false, { message: 'Invalid username or password' });
  });
};

var ensureSessionHasCsrfSecret = function (req, res, next) {
  if (req.session.csrfSecret) return next();
  req.session.csrfSecret = csrf().secretSync();
  var correlationId = req.headers[CORRELATION_HEADER] ||'';

  req.session.save(function(err) {
    if (err) {
      logger.error(`[${correlationId}] Error saving csrf secret `, err);
    } else {
      logger.info(`[${correlationId}] Saved csrfSecret: ${req.session.csrfSecret} for session ID: ${req.session.id}`);
    }
    next();
  });
};

var redirectToLogin = function (req,res) {
  req.session.last_url = req.originalUrl;
  var correlationId = req.headers[CORRELATION_HEADER] ||'';

  req.session.save(function (err) {
    if(err) {
      logger.error(`[${correlationId}] Error saving session on redirectToLogin `, err);
    } else {
      logger.info(`[${correlationId}] Saved session ID on redirectToLogin: ${req.session.id} with last url ${req.session.last_url}`);
    }
    res.redirect(paths.user.logIn);
  });
};

var get_gateway_account_id = function (req) {
  var id = _.get(req,"user.gateway_account_id");
  if (!id) return null;
  return parseInt(id);
};

var enforceUserFirstFactor = function (req, res, next) {
  var hasUser     = _.get(req, "user"),
  hasAccount      = get_gateway_account_id(req),
  disabled        = _.get(hasUser, "disabled");
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
  req.session.reload(function (err) {
    var hasLoggedInOtp  = _.get(req,"session.secondFactor") == 'totp';

    enforceUserFirstFactor(req, res, function(){
      if (!hasLoggedInOtp) return res.redirect(paths.user.otpLogIn);
      next();
    });
  });
};

var initialise = function (app, override_strategy) {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use('local',new localStrategy({ usernameField: 'username' }, localStrategyAuth));
  passport.use(new TotpStrategy(
    function(user, done) {
      return done(null, user.otp_key, 30);
    }
  ));

  passport.serializeUser(this.serializeUser);

  passport.deserializeUser(this.deserializeUser);

};

var deserializeUser = function (email, done) {
  User.find(email).then(function(user){
    done(null, user);
  });
}

var serializeUser = function (user, done) {
  done(null, user.email);
};

module.exports = {
  enforceUserFirstFactor: enforceUserFirstFactor,
  enforceUserBothFactors: enforceUserBothFactors,
  ensureSessionHasCsrfSecret: ensureSessionHasCsrfSecret,
  initialise: initialise,
  deserializeUser: deserializeUser,
  serializeUser: serializeUser,
  localStrategyAuth: localStrategyAuth,
  no_access: no_access,
  get_gateway_account_id: get_gateway_account_id
};
