"use strict";
var errorView = require('../utils/response.js').renderErrorView;
var User      = require('../models/user.js');
var paths     = require('../paths.js');
var _         = require('lodash');
var logger    = require('winston');
var CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;

var lockOut = (req,res, user) => {
  user.toggleDisabled(true).then(()=>{
    var correlationId = req.headers[CORRELATION_HEADER] ||'';
    logger.error(`[${correlationId}] locked out user id: ${user.id} due to many password attempts`);
    res.render("login/noaccess");
  })
}

module.exports = {
  enforce: function (req, res, next) {
   var email = _.get(req.body, 'email') || _.get(req.user, 'email');
    var correlationId = req.headers[CORRELATION_HEADER] ||'';
    User.find(email, correlationId).then((user)=> {
      user.incrementLoginCount().then(
        ()=> {
          var attempts  = user.login_counter,
          cap           = (process.env.LOGIN_ATTEMPT_CAP) ? process.env.LOGIN_ATTEMPT_CAP : 10,
          overLimit     = (attempts + 1) > cap; 
          if (overLimit) return lockOut(req, res, user);
          next()
        },
        ()=> { throw new Error("couldn't save user login counter");}
      )
    },next)
  }
};
