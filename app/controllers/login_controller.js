var logger = require('winston');
var response = require('../utils/response.js').response;
var router = require('../routes.js');

module.exports.callback = function (req, res) {
  var lastUrl = req.session.last_url;
  req.session.last_url = undefined;
  req.session.save(function () {
    res.redirect(lastUrl || router.paths.root);
  });
};

module.exports.loggedIn = function (req, res) {
  req.session.reload(function (err) {
    res.render('logged_in', {
      name: req.session.passport.user.displayName
    });
  });
};

module.exports.logIn = function (req, res) {
  req.session.save(function (err) {
    res.redirect(router.paths.root);
  });
};

module.exports.logOut = function (req, res) {
  req.logout();
  logger.info('Logged out user');
  req.session.destroy(req.session.id, function(err) {
    logger.info('user session removed');
  });
  res.redirect(router.paths.user.logIn);
};

module.exports.noAccess = function (req, res) {
  res.render('noaccess');
};

module.exports.bindRoutesTo = function (app) {
};
