var logger          = require('winston');
var normalise       = require('../services/normalise_user.js');
var User            = require('../models/user.js');
var router 			= require('../routes.js');

module.exports.intro = function (req, res) {
  res.render('users/intro');
};

module.exports.new = function(req, res) {
  res.render('users/new');
};

module.exports.create = function(req, res) {
  var newUser = normalise.user(req.body);
  User.create(newUser).then(()=>{
    req.flash('generic', 'User created');
  	res.redirect(router.paths.user.index)
  })
};

module.exports.index = function(req, res) {
  User.findAll().then((users)=> {
  	res.render('users/index', { users: users })
  })
};

module.exports.show = function(req, res) {
  User.findById(req.params.id).then((user)=> {
    res.render('users/show', { user: user })
  },()=> console.log('ERROR?'))
};

var toggleDisabled = function(req, res, toggle, text) {
  User.findById(req.params.id).then((user)=> {
    console.log(toggle);
    user.toggleDisabled(toggle);
    req.flash('generic', `User ${text}`);
    var redirect = router.generateRoute(router.paths.user.show, {
      id: req.params.id
    });
    res.redirect(redirect)
  },()=> console.log('ERROR?'))
};

module.exports.disable = function(req, res) {
  toggleDisabled(req, res, true,'disabled');
};

module.exports.enable = function(req, res) {
  toggleDisabled(req, res, false,'enabled');
};


