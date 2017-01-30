"use strict";
var userService      = require('../services/user_service2.js');
var paths     = require('../paths.js');
var _         = require('lodash');
var logger    = require('winston');
var CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;

var lockOut = (req, res, user) => {
    var correlationId = req.headers[CORRELATION_HEADER] ||'';
    logger.info(`[${correlationId}] user id: ${user.id} locked out due to many password attempts`);
    res.render("login/noaccess");
};

module.exports = {
  enforce: function (req, res, next) {
   var username = _.get(req.body, 'username') || _.get(req.user, 'username');
    var correlationId = req.headers[CORRELATION_HEADER] ||'';
    return userService.findByUsername(username, correlationId)
      .then((user) => {
          if (user.disabled) {
            lockOut(req, res, user);
          } else {
            next();
          }
        })
      .catch(function() {
        var correlationId = req.headers[CORRELATION_HEADER] ||'';
        logger.info(`[${correlationId}] Unsuccessful user login due to invalid username.` +
            `IP Address [${req.connection.remoteAddress}], User-Agent [${req.get('User-Agent')}]`);
        next();
    })
  },
  enforceOtp: function (req, res, next) {
    var username = _.get(req.body, 'username') || _.get(req.user, 'username');
    var correlationId = req.headers[CORRELATION_HEADER] ||'';
    return userService.findByUsername(username, correlationId)
      .then((user)=> userService(user.username).incrementLoginCount())
      .then(
        (user) => {
          if (user.disabled) {
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
