var logger              = require('winston');
var paths               = require('../paths.js');
var errorView           = require('../utils/response.js').renderErrorView;
var forgottenPassword   = require('../models/forgotten_password.js');
var userService         = require('../services/user_service.js');
var e                   = module.exports;
var CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;

e.emailGet = (req, res)=> {
  res.render('forgotten_password/username_get');
};

e.emailPost = (req, res)=> {
  var username = req.body.username,
  correlationId = req.headers[CORRELATION_HEADER] ||'';

  return userService.findByUsername(username, correlationId)
    .then(
      (user) => {
        return userService.sendPasswordResetToken(user, correlationId)
      },
      () => {
        logger.info(`[${correlationId}] user not found`);
      }
    )
    .finally(() => {
      res.redirect(paths.user.passwordRequested);
    })
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

  return userService.findByResetToken(id).then(render, ()=> {
    req.flash('genericError', 'Invalid password reset link');
    res.redirect('/login');
  });
};

e.newPasswordPost = (req, res)=> {
  var reqUser;
  userService
  .findByResetToken(req.params.id)
  .then(function(user){
    if (!user) return errorView(req, res);
    reqUser = user;
    return user.updatePassword(req.body.password);
  })
  .then(function(){
    return forgottenPassword.destroy(req.params.id);
  })
  .then(function(){
    userService.logOut(reqUser).then(
      ()=>{
        req.session.destroy();
        req.flash('generic', 'Password has been updated');
        res.redirect('/login');
      },
      ()=>{
        errorView(req, res);
        logger.error('PROBLEM LOGGIN OUT LOGGED IN USERS')
      }
    );
  })
  .catch(function(error) {
    req.flash('genericError', error.errors[0].message);
    res.redirect('/reset-password/' + req.params.id);
  });
};
