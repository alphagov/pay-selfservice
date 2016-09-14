var logger    = require('winston');
var paths     = require('../paths.js');
var errorView = require('../utils/response.js').renderErrorView;
var User      = require('../models/user.js');
var forgottenPassword = require('../models/forgotten_password.js');
var e         = module.exports;

e.emailGet = (req, res)=> {
  res.render('forgotten_password/email_get');
};

e.emailPost = (req, res)=> {
  var email = req.body.email,

  redirect  = (e) => res.redirect(paths.user.passwordRequested),

  foundUser = (user) => { user.sendPasswordResetToken().then(redirect, redirect);}
  User.find(email).then(foundUser, redirect );
};

e.passwordRequested = (req, res)=> {
  res.render('forgotten_password/password_requested');
};

e.newPasswordGet = (req, res)=> {
  var id = req.params.id,
  render = (user)=> {
    if (!user) return errorView(req, res);
    res.render('forgotten_password/new_password', {id: id});
  };

  User.findByResetToken(id).then(render, ()=> {
    req.flash('genericError', 'Invalid password reset link');
    res.redirect('/login');
  });
};

e.newPasswordPost = (req, res)=> {
  User
  .findByResetToken(req.params.id)
  .then(function(user){
    if (!user) return errorView(req, res);
    return user.updatePassword(req.body.password);
  })
  .then(function(){
    return forgottenPassword.destroy(req.params.id);
  })
  .then(function(){
    req.flash('generic', 'Password has been updated');
    res.redirect('/login');
  }).catch(function(error) {
    res.redirect('/login');
  });
};
