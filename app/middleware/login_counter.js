"use strict";
var userService      = require('../services/user_service.js');
var paths     = require('../paths.js');
var _         = require('lodash');
var logger    = require('winston');
var CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;

var lockOut = (req, res, user) => {
  user.toggleDisabled(true).then(()=>{
    var correlationId = req.headers[CORRELATION_HEADER] ||'';
    logger.info(`[${correlationId}] user id: ${user.id} locked out due to many password attempts`);
    res.render("login/noaccess");
  })
};

module.exports = {
  enforce: function (req, res, next) {
   var username = _.get(req.body, 'username') || _.get(req.user, 'username');
    var correlationId = req.headers[CORRELATION_HEADER] ||'';
    return userService.findByUsername(username, correlationId)
      .then((user)=> {
        user.incrementLoginCount();
        return user;
      })
      .then(
        (user) => {
          var attempts  = user.login_counter,
          cap           = (process.env.LOGIN_ATTEMPT_CAP) ? process.env.LOGIN_ATTEMPT_CAP : 10,
          overLimit     = (attempts + 1) > cap;
          if (overLimit) {
            return lockOut(req, res, user);
          } else {
            next();
          }
        },
        () => {
          throw new Error("couldn't save user login counter");
        }
      )
      .catch(function() {

        var correlationId = req.headers[CORRELATION_HEADER] ||'';
        logger.info(`[${correlationId}] Unsuccessful user login due to invalid username.` +
            `IP Address [${req.connection.remoteAddress}], User-Agent [${req.get('User-Agent')}]`);
        next();
    })
  }
};
