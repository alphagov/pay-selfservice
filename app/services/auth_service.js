"use strict";
var logger = require('winston');
var session = require('express-session');
var Auth0Strategy = require('passport-auth0');
var passport = require('passport');
var selfServiceSession = require(__dirname + '/../utils/session.js').selfServiceSession;
var paths = require(__dirname + '/../paths.js');

var logIfError = function(scenario, err) {
  if (err) {
    logger.warn(scenario + ' [' + err + ']');
  }
};

var AUTH_STRATEGY_NAME = 'auth0';
var AUTH_STRATEGY = new Auth0Strategy({
    domain: process.env.AUTH0_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: paths.user.callback
  },
  function (accessToken, refreshToken, extraParams, user, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    logger.info('Logged in: ' + user.displayName);
    return done(null, user);
  }
);

var auth = {
  enforce: function (req, res, next) {
    req.session.reload(function (err) {
      logIfError('enforce reload',err);

      if (req.session.passport && req.session.passport.user) {
        if (auth.get_account_id(req)) {
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

  login: passport.authenticate(AUTH_STRATEGY_NAME, {session: true}),

  callback: passport.authenticate(AUTH_STRATEGY_NAME, {failureRedirect: paths.user.logIn}),

  bind: function (app, override_strategy) {
    var strategy = override_strategy || AUTH_STRATEGY;

    passport.use(strategy);

    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser(function (user, done) {
      done(null, user);
    });

    app.use(passport.initialize());
    app.use(passport.session());

    app.use(session(selfServiceSession()));
  },

  no_access: function (req, res, next) {
    if (req.url != paths.user.noAccess) {
      res.redirect(paths.user.noAccess);
    }
    else {
      next(); // don't redirect again if we're already there
    }
  },

  get_account_id: function (req) {
    var user = req.session.passport.user;
    return user._json && user._json.app_metadata && user._json.app_metadata.account_id ? parseInt(user._json.app_metadata.account_id) : null;
  }
};

module.exports = auth;
