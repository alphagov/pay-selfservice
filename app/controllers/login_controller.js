var logger    = require('winston');
var response  = require('../utils/response.js').response;
var random    = require('../utils/random.js');
var router    = require('../routes.js');
var passport  = require('passport');
var base32    = require('thirty-two');
var User      = require('../models/user.js');
var paths     = require('../paths.js');


var logIfError = function (scenario, err) {
  if (err) {
    logger.warn(scenario + ' -', {'error': err});
  }
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
  if (!req.user.otp_key) {
    return res.redirect(router.paths.user.otpSetup);
  }

  if (!req.session.sentCode) {
    req.user.sendOTP();
    req.session.sentCode = true;
  }
  res.render('login/otp-login');

};

module.exports.otpSetup = function (req, res) {
  if (req.user.otp_key) {
    return res.redirect(router.paths.root);
  }

  var user        = req.user;
  var key         = random.key(10);
  var encodedKey  = base32.encode(key);
  var otpUrl      = 'otpauth://totp/' + user.email +
                    '?secret=' + encodedKey + '&period=30';
  var qrImage     = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' +
                    encodeURIComponent(otpUrl);

  User.updateOtpKey(user.email, key).then(function(){
    res.render('login/otp-setup', { user: user, key: key, qrImage: qrImage });
  },function(err){ res.render('error'); });
};

module.exports.afterOTPLogin = function (req, res) {
  req.session.secondFactor = 'totp';
  res.redirect('/');
};


module.exports.sendAgainGet = function(req, res){
  res.render('login/send_otp_again');
};

module.exports.sendAgainPost = function(req, res){
  req.user.sendOTP();
  res.redirect(paths.user.otpLogIn);
};




