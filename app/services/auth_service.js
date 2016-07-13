var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var session = require('express-session');
var selfServiceSession = require(__dirname + '/../utils/session.js').selfServiceSession;
var logger = require('winston');
var csrf = require('csrf');
var paths = require(__dirname + '/../paths.js');
var User = require(__dirname + '/../models/user.js');
var TotpStrategy = require('passport-totp').Strategy;





var db = require(__dirname + "/db.js");

module.exports = function(){
  var logIfError = function (scenario, err) {
    if (err) {
      logger.warn(scenario + ' -', {'warn': err});
    }
  };


  var initialise = function(app){
    app.use(session(selfServiceSession()));
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use('local',
      new Strategy(
        function(username, password, cb) {
          User.authenticate(username, password).then(function(user){
            console.log('hello',user);
            return cb(null, user);
          },function(){
            console.log('hi');
            return cb(null, false);
          });
        }
      )
    );



    passport.serializeUser(function(user, cb) {
      cb(null, user.email);
    });

    passport.deserializeUser(function(userEmail, cb) {
      User.find(userEmail).then(function(user){
        cb(null, user.dataValues);
      });
    });
  };

  var enforce = function (req, res, next) {
    req.session.reload(function (err) {
      logIfError('Enforce reload of LogIn', err);
      var hasUser = req.session.passport && req.session.passport.user;
      var twoFactor = req.session.secondFactor == 'totp';
      if (!hasUser) {
        req.session.last_url = req.originalUrl;
        req.session.save(function () {
          res.redirect(paths.user.logIn);
        });
        return;
      }

      if (!twoFactor) {
        res.redirect("/login-otp");
      }

      if (get_account_id(req)) {
        if (!req.session.csrfSecret) {
          req.session.csrfSecret = csrf().secretSync();
          logger.info('Created csrfSecret');
        }
        next();
      }
      else {
        no_access(req, res, next);
      }
    });
  };

 var no_access = function (req, res, next) {
    if (req.url != paths.user.noAccess) {
      res.redirect(paths.user.noAccess);
    }
    else {
      next(); // don't redirect again if we're already there
    }
  };


 var get_account_id =  function (req) {
    var user = req.user.account_id;
    return user ? 1 : null;
  };



  return {
    initialise: initialise,
    enforce: enforce,
    no_access: no_access,
    get_account_id: get_account_id
  };


}();
