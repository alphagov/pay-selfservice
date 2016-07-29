var logger    = require('winston');
var response  = require('../utils/response.js').response;
var router    = require('../routes.js');
var passport  = require('passport');
var paths     = require('../paths.js');
var renderErrorView = require('../utils/response.js').renderErrorView;


var logIfError = function (scenario, err) {
  if (err) {
    logger.warn(scenario + ' -', {'error': err});
  }
};

var error = function(req,res,err) {
    logger.info(err);
    renderErrorView(req, res);
};

module.exports.loggedIn = function (req, res) {
  req.session.reload(function (err) {
    logIfError('LoggedIn reload session', err);
    res.render('logged_in', {
      name: req.user.username
    });
  });
};

module.exports.logOut = function (req, res) {
  req.logout();
  logger.info('Logged out user');
  req.session.destroy(req.session.id, function (err) {
    logIfError('logOut destroy session', err);
    logger.info('user session removed');
  });
  res.redirect(router.paths.user.logIn);
};

module.exports.noAccess = function (req, res) {
  res.render('noaccess');
};

module.exports.logInGet = function (req, res) {
  res.render('login');
};

module.exports.postLogin = function (req, res) {
  if (req.session.last_url) {
    res.redirect(req.session.last_url);
    delete req.session.last_url;
    return;
  }
  res.redirect('/');
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
      res.render('login/otp-login');
    },(err) => error(req,res,error)
    );
  } else {
    res.render('login/otp-login');
  }

};

module.exports.afterOTPLogin = function (req, res) {
  req.session.secondFactor = 'totp';
  res.redirect('/');
};

module.exports.sendAgainGet = function(req, res){
  res.render('login/send_otp_again');
};

module.exports.sendAgainPost = function(req, res){
  req.user.sendOTP().then(function(){
    res.redirect(paths.user.otpLogIn);
  },(err) => error(req,res,error)
  );
};
