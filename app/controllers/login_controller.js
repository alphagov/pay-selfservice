var logger = require('winston');
var response = require('../utils/response.js').response;
var ERROR_MESSAGE = require('../utils/response.js').ERROR_MESSAGE;
var renderErrorView = require('../utils/response.js').renderErrorView;

var auth = require('../services/auth_service.js');

module.exports.bindRoutesTo = function (app) {

  app.get('/', function(req, res) {
    res.render('index');
  });

  app.get('/login', auth.login, function (req, res) {
    res.redirect("/");
  });

  app.get('/callback', auth.callback, function(req, res) {
    res.redirect('/protected');
  });

  app.get('/protected', auth.enforce, function (req, res) {
    res.render('greeting', {
      greeting: 'Hello',
      name: req.session.passport.user.displayName
    });
  });

};
