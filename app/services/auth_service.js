"use strict";
var logger = require('winston');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var TotpStrategy = require('passport-totp').Strategy;
var paths = require(__dirname + '/../paths.js');
var csrf = require('csrf');
var User = require(__dirname + '/../models/user.js');
var _ = require('lodash');


var logIfError = function (scenario, err) {
  if (err) {
    logger.warn(scenario + ' -', {'warn': err});
  }
};

var localStrategyAuth = function(username, password, done) {
  User.authenticate(username,password)
  .then(function(user){
    done(null, user);
  },function(){
    done(null, false);
  });
};

var appendCSRF = function(req){
  req.session.csrfSecret = csrf().secretSync();
  logger.info('Created csrfSecret');
},

redirectToLogin = function(req,res){
  req.session.last_url = req.originalUrl;
  req.session.save(function () {
    res.redirect(paths.user.logIn);
  });
};

function enforceUser(req, res, next){
  var hasUser     = _.get(req,"user"),
  hasAccount      = auth.get_gateway_account_id(req);

  if (!hasUser) return redirectToLogin(req,res);
  if (!hasAccount) return auth.no_access(req, res, next);
  next();
}


var auth = {

  enforceUser: enforceUser,
  enforce: function (req, res, next) {
    req.session.reload(function (err) {
      logIfError('Enforce reload of LogIn', err);
      var hasLoggedInOtp  = _.get(req,"session.secondFactor") == 'totp';

      enforceUser(req, res, function(){
        if (!req.session.csrfSecret) appendCSRF(req);
        if (!hasLoggedInOtp) return res.redirect(paths.user.otpLogIn);
        next();
      });
    });
  },
  initialise: function (app, override_strategy) {

    app.use(passport.initialize());
    app.use(passport.session());
    passport.use('local',new localStrategy(localStrategyAuth));
    passport.use(new TotpStrategy(
      function(user, done) {
        return done(null, user.otp_key, 30);
      }
    ));

    passport.serializeUser(this.serializeUser);

    passport.deserializeUser(this.deserializeUser);

  },

  deserializeUser: function (email, done) {
    User.find(email).then(function(user){
      done(null, user);
    });
  },

  serializeUser: function (user, done) {
    done(null, user.email);
  },

  localStrategyAuth: localStrategyAuth,

  no_access: function (req, res, next) {
    if (req.url != paths.user.noAccess) {
      res.redirect(paths.user.noAccess);
    }
    else {
      next(); // don't redirect again if we're already there
    }
  },

  get_gateway_account_id: function (req) {
    var id = _.get(req,"user.gateway_account_id");
    if (!id) return null;
    return parseInt(id);
  }
};

module.exports = auth;
