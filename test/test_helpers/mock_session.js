'use strict';
var express = require('express');

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
        next();
      };


      next();
    });
    proxyApp.use(app);
    return proxyApp;
  };

  var mockValidAccount = function (app, accountId) {
    var validSession = {
      csrfSecret: "123",
      12345: {refunded_amount: 5 },
      passport: {
        user: {
          gateway_account_id: accountId
        }
      }
    };
    return mockSession(app, validSession);
  };

  return {
    mockSession: mockSession,
    mockValidAccount: mockValidAccount
  }
}();
