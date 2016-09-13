'use strict';
var express = require('express');
var _       = require('lodash');

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

    return _.cloneDeep({
      csrfSecret: "123",
      12345: {refunded_amount: 5 },
      passport: {
        user: {
          gateway_account_id: accountId,
          username: "username123",
          email:"user@email.com",
          otp_key: "foo"
        }
      },
      secondFactor: 'totp'
    });

  };

  return {
    mockSession: mockSession,
    mockValidAccount: mockValidAccount,
    mockAccount: mockAccount,
    mockAccountObj: mockAccountObj
  };
}();
