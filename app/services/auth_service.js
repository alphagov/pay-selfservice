var logger = require('winston');
var clientSessions = require("client-sessions");
var Auth0Strategy = require('passport-auth0');
var passport = require('passport');
var util = require('util');

var AUTH_STRATEGY_NAME = 'auth0';
var AUTH_STRATEGY = new Auth0Strategy({
    domain:       process.env.AUTH0_URL,
    clientID:     process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:  '/selfservice/callback'
  },
  function(accessToken, refreshToken, extraParams, user, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    logger.info('Logged in: ' + user.displayName);
    return done(null, user);
  }
);

var auth = module.exports = {  
    enforce: function (req, res, next) {
        if (req.session.passport && req.session.passport.user) {
          if (auth.get_account_id(req)) {
            next();
          }
          else {
            if (req.url != '/selfservice/noaccess') {
              res.redirect('/selfservice/noaccess');
            }
            else {
              next(); // don't redirect if we're already there...
            }
          }
        } else {
            req.session.last_url = req.originalUrl;
            res.redirect('/selfservice/login');
        }
    },

    login: passport.authenticate(AUTH_STRATEGY_NAME, { session: true }),

    callback: function (req, res, next) {
      var authen_func = passport.authenticate(
          'auth0',
          {
            failureRedirect: '/selfservice/login',
            successRedirect: req.session.last_url
          }
      );
      req.session.last_url = undefined;
      return authen_func(req, res, next);
    },

    bind: function (app, override_strategy) {
        var strategy = override_strategy || AUTH_STRATEGY;
        
        passport.use(strategy);
        
        passport.serializeUser(function(user, done) {
          done(null, user);
        });
        
        passport.deserializeUser(function(user, done) {
          done(null, user);
        });
        
        app.use(passport.initialize());
        app.use(passport.session());
        
        app.use(clientSessions({
            cookieName: 'session',
            secret: process.env.SESSION_ENCRYPTION_KEY
        }));
    },
    
    get_account_id: function(req) {
      var user = req.session.passport.user;
      return user._json && user._json.app_metadata ? parseInt(user._json.app_metadata.account_id) : null;
    }
};
