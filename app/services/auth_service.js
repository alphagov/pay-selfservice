"use strict";
var logger = require('winston');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
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


var auth = {
  enforce: function (req, res, next) {

    req.session.reload(function (err) {
      logIfError('Enforce reload of LogIn', err);

      if (req.session.passport && req.session.passport.user) {
        if (auth.get_gateway_account_id(req)) {
          if (!req.session.csrfSecret) {
            req.session.csrfSecret = csrf().secretSync();
            logger.info('Created csrfSecret')
          }
          next();
        }
        else {
          auth.no_access(req, res, next);
        }
      } else {
        req.session.last_url = req.originalUrl;
        req.session.save(function () {
          res.redirect(paths.user.logIn);
        });
      }
    });
  },

  initialise: function (app, override_strategy) {

    app.use(passport.initialize());
    app.use(passport.session());
    passport.use('local',new localStrategy({usernameField: 'email'}, localStrategyAuth));

    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser(function (user, done) {
      done(null, user);
    });

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
    var id = _.get(req,"session.passport.user.gateway_account_id");
    if (!id) return null;
    return parseInt(id);
  }
};

module.exports = auth;
