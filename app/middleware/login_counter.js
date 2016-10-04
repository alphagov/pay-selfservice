"use strict";
var errorView = require('../utils/response.js').renderErrorView;
var User      = require('../models/user.js');
var paths     = require('../paths.js');
var _         = require('lodash');
var logger    = require('winston');


var lockOut = (req,res, user) => {
  user.toggleDisabled(true).then(()=>{
    logger.error("locked out user id:" + user.id + " due to many password attempts");
    res.render("login/noaccess");
  })
}

module.exports = {
  enforce: function (req, res, next) {
   var email = _.get(req.body, 'email') || _.get(req.user, 'email');
    User.find(email).then((user)=> {
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
