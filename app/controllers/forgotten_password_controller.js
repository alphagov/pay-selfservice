var logger              = require('winston');
var paths               = require('../paths.js');
var errorView           = require('../utils/response.js').renderErrorView;
var User                = require('../models/user.js');
var forgottenPassword   = require('../models/forgotten_password.js');
var e                   = module.exports;
var CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;

e.emailGet = (req, res)=> {
  res.render('forgotten_password/email_get');
};

e.emailPost = (req, res)=> {
  var email = req.body.email,
  correlationId = req.headers[CORRELATION_HEADER] ||'',
  redirect  = (e) => res.redirect(paths.user.passwordRequested),

  foundUser = (user) => { user.sendPasswordResetToken(correlationId).then(redirect, redirect);}
  User.find(email, correlationId).then(foundUser, redirect );
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
    req.flash('genericError', error.errors[0].message);
    res.redirect('/reset-password/' + req.params.id);
  });
};
