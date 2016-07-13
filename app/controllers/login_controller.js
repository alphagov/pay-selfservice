var logger    = require('winston');
var response  = require('../utils/response.js').response;
var router    = require('../routes.js');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;

var logIfError = function (scenario, err) {
  if (err) {
    logger.warn(scenario + ' -', {'error': err});
  }
};



module.exports.loggedIn = function (req, res) {
    res.render('logged_in', {
      name: req.user.displayName
    });
};

module.exports.logInGet = function (req, res) {
  res.render('login/login');
};

module.exports.postLogin = function (req, res) {
  res.redirect('/');
};

module.exports.logUserin = function() {
  return passport.authenticate('local', { failureRedirect: '/login' });
};


module.exports.noAccess = function (req, res) {
  res.render('noaccess');
};

module.exports.logOut = function(req, res){
  req.logout();
  res.redirect('/');
};
