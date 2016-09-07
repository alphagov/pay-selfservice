
var logger    = require('winston');
var response  = require('../utils/response.js').response;
var router    = require('../routes.js');
var passport  = require('passport');
var paths     = require('../paths.js');
var errorView = require('../utils/response.js').renderErrorView;

var logIfError = function (scenario, err) {
  if (err) {
    logger.warn(scenario + ' -', {'error': err});
  }
};

var error = function(req,res,err) {
    errorView(req, res);
    logger.info(err);
};

module.exports.loggedIn = function (req, res) {
  req.session.reload(function (err) {
    logIfError('LoggedIn reload session', err);
    res.render('login/logged_in', {
      name: req.user.username
    });
  });
};

module.exports.logOut = function (req, res) {
  req.logout();
  res.redirect(router.paths.user.logIn);
};

module.exports.noAccess = function (req, res) {
  res.render('login/noaccess');
};

module.exports.logInGet = function (req, res) {
  res.render('login/login');
};

module.exports.postLogin = function (req, res) {
  req.session.save(() => res.redirect('/'));
};

module.exports.logUserin = function() {
  return passport.authenticate('local', { failureRedirect: '/login' });
};

module.exports.logUserinOTP = function(req, res, next) {
  return passport.authenticate('totp', { failureRedirect: '/otp-login' });
};

module.exports.otpLogIn = function (req, res) {
  if (!req.session.sentCode) {
    req.user.sendOTP().then(function(){
      req.session.sentCode = true;
      req.session.save(() => res.render('login/otp-login'));
    },function(err) { error(req,res,error); }
    );
  } else {
    res.render('login/otp-login');
  }
};

module.exports.afterOTPLogin = function (req, res) {
  req.session.secondFactor = 'totp';
  if (req.session.last_url) {
    var last_url = req.session.last_url;
    delete req.session.last_url;
    req.session.save(() => res.redirect(last_url));
    return;
  }

  req.session.save(() => res.redirect('/'));
};

module.exports.sendAgainGet = function(req, res){
  res.render('login/send_otp_again');
};

module.exports.sendAgainPost = function(req, res){
  req.user.sendOTP().then(function(){
    req.session.save(() => res.redirect(paths.user.otpLogIn));
  },(err) => error(req,res,error)
  );
};
