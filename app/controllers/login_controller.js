var logger    = require('winston');
var _ = require('lodash');
var response  = require('../utils/response.js').response;
var userService  = require('../services/user_service.js');
var router    = require('../routes.js');
var passport  = require('passport');
var paths     = require('../paths.js');
var response = require('../utils/response.js').response;
var errorView = require('../utils/response.js').renderErrorView;
var CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;

var error = function(req,res,err) {
    errorView(req, res);
    logger.error(err);
};

var logLoginAction = function(req, message) {
  var correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '');
  logger.info(`[${correlationId}] ${message}`);
};

module.exports.loggedIn = function (req, res) {
  logLoginAction(req, 'successfully logged in');
  response(req, res, 'login/logged_in', {
    name: req.user.username
  });
};

module.exports.logOut = function (req, res) {
  if (req.user) {
    userService.logOut(req.user, req.correlationId);
  }

  if (req.session) {
    logLoginAction(req, 'logged out');
    req.session.destroy();
  }
  res.redirect(router.paths.user.logIn);
};
  

module.exports.noAccess = function (req, res) {
  res.render('login/noaccess');
};

module.exports.logInGet = function (req, res) {
  res.render('login/login');
};

/**
 * Reset the login counter for the user, and clean
 * session
 *
 * @param req
 * @param res
 */
module.exports.postLogin = function (req, res) {
  req.session = _.pick(req.session, ['passport', 'last_url', 'currentGatewayAccountId']);
  logLoginAction(req, 'successfully attempted username/password combination');
  res.redirect(paths.user.otpLogIn);
};

module.exports.logUserin = function(req,res, next) {
  return passport.authenticate('local', {
    failureRedirect: '/login',
    badRequestMessage : 'Invalid username or password.',
    failureFlash: true
  })(req, res, next);
};

module.exports.logUserinOTP = function(req, res, next) {
  return passport.authenticate('totp', { failureRedirect: '/otp-login' })(req, res, next);
};

module.exports.otpLogIn = function (req, res) {
  if (!req.session.sentCode) {
    var correlationId = req.headers[CORRELATION_HEADER] ||'';
    userService.sendOTP(req.user, correlationId).then(function(){
      req.session.sentCode = true;
      res.render('login/otp-login');
    },function(err) { error(req,res,err); }
    );
  } else {
    res.render('login/otp-login');
  }
};

module.exports.afterOTPLogin = function (req, res) {
  req.session.secondFactor = 'totp';
  var redirect_url = (req.session.last_url) ? req.session.last_url : "/";
  delete req.session.last_url;
  return userService.resetLoginCount(req.user.username, req.headers[CORRELATION_HEADER] ||'')
    .then(()=>{
      logLoginAction(req, 'successfully entered a valid 2fa token');
      res.redirect(redirect_url);
    },
    (err) => error(req, res, error)
  )
};

module.exports.sendAgainGet = function(req, res){
  res.render('login/send_otp_again');
};

module.exports.sendAgainPost = function(req, res){
  var correlationId = req.headers[CORRELATION_HEADER] ||'';
  userService.sendOTP(req.user, correlationId).then(
    () => { res.redirect(paths.user.otpLogIn); },
    (err) => { error(req,res,err); }
  );
};
