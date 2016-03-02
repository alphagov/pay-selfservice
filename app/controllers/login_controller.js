var logger = require('winston');
var response  = require('../utils/response.js').response;
var auth      = require('../services/auth_service.js');
var router    = require('../routes.js');

module.exports.callback = function(req, res) {
  res.redirect(router.paths.root);
};

module.exports.loggedIn = function(req, res) {
  res.render('logged_in', {
    name: req.session.passport.user.displayName
  });
};

module.exports.logIn = function(req, res) {
  res.redirect(router.paths.root);
}

module.exports.logOut = function(req, res) {
  req.logout();
  req.session.destroy();
  logger.info('Logged out user');
  res.redirect(router.paths.user.logIn);
}

module.exports.noAccess = function(req, res){
  res.render('noaccess');
}

module.exports.bindRoutesTo = function (app) {
};
