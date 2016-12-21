'use strict';
var express = require('express');
var User = require('../../app/models/user').User;
var _       = require('lodash');
var user = User.build({
  username: Math.random().toString(36).substring(7),
  email: Math.random().toString(36).substring(7) + "@email.com",
  telephone_number: Math.random().toString(36).substring(7),
  otp_key: "foo",
  password: "password"
});

module.exports = function () {

  var mockSession = function (app, sessionData,noCSRF) {
    var proxyApp = express();
    proxyApp.all("*", function (req, res, next) {
      req.session = sessionData || {};
      if (!noCSRF) req.session.csrfSecret = "123";
      req.session.reload = function (next) {
        next();
      };
      req.session.save = function (next) {
        next();
      };
      req.session.destroy = function (sessionId, next) {
        if (typeof sessionId == "function") next = sessionId;
         if (typeof next == "function") next();
        next()
      };


      next();
    });
    proxyApp.use(app);
    return proxyApp;
  };

  var mockValidAccount = function (app, accountId) {
    var validSession = mockAccountObj(accountId);
    return mockSession(app, validSession);
  },
  mockAccount = function(app, account) {
    return mockSession(app, account);
  },
  mockAccountObj = function(accountId){
    user.gateway_account_id = accountId;
    return _.cloneDeep({
      csrfSecret: "123",
      12345: {refunded_amount: 5 },
      passport: {
        user: user,
      },
      secondFactor: 'totp'
    });

  };

  return {
    mockSession: mockSession,
    mockValidAccount: mockValidAccount,
    mockAccount: mockAccount,
    mockAccountObj: mockAccountObj,
    user: user
  };
}();
