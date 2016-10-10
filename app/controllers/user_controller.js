var logger = require('winston');
var normalise = require('../services/normalise_user.js');
var User = require('../models/user.js');
var router = require('../routes.js');
var CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER;

module.exports.intro = function (req, res) {
  res.render('users/intro');
};

module.exports.new = function (req, res) {
  res.render('users/new');
};

module.exports.create = function (req, res) {
  var newUser = normalise.user(req.body);
  User.create(newUser).then(()=> {
    req.flash('generic', 'User created');
    res.redirect(router.paths.user.index)
  })
};

module.exports.index = function (req, res) {
  User.findAll().then((users)=> {
    res.render('users/index', {users: users})
  })
};

module.exports.show = function (req, res) {
  User.findById(req.params.id).then((user)=> {
    res.render('users/show', {user: user})
  }, ()=> console.log('ERROR?'))
};

module.exports.sendPasswordReset = function (req, res) {
  var correlationId = req.headers[CORRELATION_HEADER] || '';
  var redirect = router.generateRoute(router.paths.user.show, {
    id: req.params.id
  });
  User.findById(req.params.id).then((user)=> {
    user.sendPasswordResetToken(correlationId)
      .then(()=> {
          req.flash('generic', 'Password reset sent');
          res.redirect(redirect)

        },
        ()=> {
          req.flash('genericError', 'Password reset sent failed');
          res.redirect(redirect)
        });
  }, ()=> console.log('ERROR'))
};

var toggleDisabled = function (req, res, toggle, text) {
  User.findById(req.params.id).then((user)=> {
    console.log('toggling user ', text);
    user.toggleDisabled(toggle);
    req.flash('generic', `User ${text}`);
    var redirect = router.generateRoute(router.paths.user.show, {
      id: req.params.id
    });
    res.redirect(redirect)
  }, ()=> console.log('ERROR?'))
};

module.exports.disable = function (req, res) {
  toggleDisabled(req, res, true, 'disabled');
};

module.exports.enable = function (req, res) {
  toggleDisabled(req, res, false, 'enabled');
};


