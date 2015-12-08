var clientSessions = require("client-sessions");
var Auth0Strategy = require('passport-auth0');
var passport = require('passport');

var strategy = new Auth0Strategy({
    domain:       'uk-pymnt.eu.auth0.com',
    clientID:     'hB0ktsZUZ38wZkn6DIrTs8jWWpkwV5YO',
    clientSecret: 'p4eOV5iN9NAoIcXXCBw2pvXBMvnZ-Igtlv5u3X6knAtKSRN63bm6emndesJIAXXe',
    callbackURL:  '/callback'
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

passport.use(strategy);
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

var auth = module.exports = {
    enforce: function (req, res, next) {
        if (req.session.passport && req.session.passport.user) {
            next();
        } else {
            res.redirect('/login');
        }
    },
    login: passport.authenticate('auth0', { session: true }),
    callback: passport.authenticate('auth0', { failureRedirect: '/login' }),
    bind: function (app) {
        app.use(passport.initialize());
        app.use(passport.session());

        app.use(clientSessions({
            cookieName: 'session',
            secret: 'ssssh'
        }));
    }
};
