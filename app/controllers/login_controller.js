
var logger    = require('winston');
var _ = require('lodash');
var response  = require('../utils/response.js').response;
var userService  = require('../services/user_service.js');
var router    = require('../routes.js');
var passport  = require('passport');
var paths     = require('../paths.js');
var errorView = require('../utils/response.js').renderErrorView;
var CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;

var error = function(req,res,err) {
    errorView(req, res);
    logger.error(err);
};

var logLoginAction = function(req, message) {
  var correlationId = req.headers[CORRELATION_HEADER] ||'';
  logger.info(`[${correlationId}] user id: ${_.get(req, 'user.id')} ${message}`);
};

module.exports.loggedIn = function (req, res) {
  logLoginAction(req, 'successfully logged in');
  req.session.reload(function (err) {
    res.render('login/logged_in', {
      name: req.user.username
    });
  });
};

module.exports.logOut = function (req, res) {
  logLoginAction(req, 'logged out');
  req.session.destroy(function (err) {
    res.redirect(router.paths.user.logIn);
  });
};
  

module.exports.noAccess = function (req, res) {
  res.render('login/noaccess');
};

module.exports.logInGet = function (req, res) {
  res.render('login/login');
};

module.exports.postLogin = function (req, res) {
 req.user.resetLoginCount().then(
    ()=>{
      req.session.save(() => res.redirect(paths.user.otpLogIn));
      logLoginAction(req, 'successfully attempted username/password combination');
    },
    (err) => error(req,res,error)
  )
};

module.exports.logUserin = function() {
  return passport.authenticate('local', {
    failureRedirect: '/login',
    badRequestMessage : 'Invalid username or password.',
    failureFlash: true
  });
};

module.exports.logUserinOTP = function(req, res, next) {
  return passport.authenticate('totp', { failureRedirect: '/otp-login' });
};

module.exports.otpLogIn = function (req, res) {
  if (!req.session.sentCode) {
    userService.sendOTP(req.user).then(function(){
      req.session.sentCode = true;
      req.session.save(() => res.render('login/otp-login'));
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
  req.user.resetLoginCount().then(
    ()=>{
      logLoginAction(req, 'successfully entered a valid 2fa token');
      req.session.save(() => res.redirect(redirect_url));
    },
    (err) => error(req,res,error)
  )
};

module.exports.sendAgainGet = function(req, res){
  res.render('login/send_otp_again');
};

module.exports.sendAgainPost = function(req, res){
  userService.sendOTP(req.user).then(
    () => { res.redirect(paths.user.otpLogIn); },
    (err) => { error(req,res,err); }
  );
};
