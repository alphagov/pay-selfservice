var response  = require('../utils/response.js').response;
var auth      = require('../services/auth_service.js');

module.exports.callback = function(req, res) {
  res.redirect('/selfservice/');
};

module.exports.loggedIn = function(req, res) {
  res.render('logged_in', {
    name: req.session.passport.user.displayName
  });
};

module.exports.logIn = function(req, res) {
  res.redirect("/");
}

module.exports.noAccess = function(req, res){
  res.render('noaccess');
}

module.exports.bindRoutesTo = function (app) {
};
