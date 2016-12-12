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


var mockSession = function (app, sessionData, noCSRF) {
    var proxyApp = express();
    proxyApp.all("*", function (req, res, next) {
      req.session = sessionData || {};

      next();
    });
    proxyApp.use(app);
    return proxyApp;
  },

  getAppWithLoggedInSession = function (app, accountId) {
    var validSession = getMockAccount(accountId);
    return mockSession(app, validSession);
  },

  getAppWithLoggedOutSession = function (app, account) {
    return mockSession(app, account);
  },

  getMockAccount = function (accountId) {
    user.gateway_account_id = accountId;
    return _.cloneDeep({
      csrfSecret: "123",
      12345: {refunded_amount: 5},
      passport: {
        user: user,
      },
      secondFactor: 'totp'
    });
  };


module.exports = {
  getAppWithLoggedInSession: getAppWithLoggedInSession,
  getAppWithLoggedOutSession: getAppWithLoggedOutSession,
  getMockAccount: getMockAccount,
  user: user
};





