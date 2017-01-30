'use strict';
var express = require('express');
var User = require('../../app/models/user2').User;
var _ = require('lodash');
var userFixture = require('../unit/fixtures/user_fixtures');
var getUser = (opts) => {
    return userFixture.validUser(opts).getAsObject();
  },
  mockSession = function (app, sessionData, noCSRF) {
    var proxyApp = express();
    proxyApp.all("*", function (req, res, next) {
      req.session = sessionData || {};
      req.session.destroy = () => {};
      next();
    });
    proxyApp.use(app);
    return proxyApp;
  },

  getAppWithLoggedInSession = function (app, user) {
    var validSession = getMockAccount(user);
    return mockSession(app, validSession);
  },

  getAppWithLoggedOutSession = function (app, account) {
    return mockSession(app, account);
  },

  getMockAccount = function (user) {
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
  getUser: getUser
};





