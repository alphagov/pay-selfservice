var response = require('../utils/response.js').response;
var auth = require('../services/auth_service.js');

module.exports.bindRoutesTo = function (app) {
  app.get('/selfservice/login', auth.login, function (req, res) {
    res.redirect("/");
  });

  app.get('/selfservice/callback', auth.callback, function(req, res) {
    res.redirect('/selfservice/welcome');
  });

  app.get('/selfservice/welcome', function(req, res) {
    res.render('logged_in', {
      name: req.session.passport.user.displayName
    });
  });
};
