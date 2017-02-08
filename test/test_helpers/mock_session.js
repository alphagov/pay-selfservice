'use strict';
var express = require('express');
var User = require('../../app/models/user').User;
var _ = require('lodash');
var sinon = require('sinon');
var userFixture = require('../fixtures/user_fixtures');
var getUser = (opts) => {
    return userFixture.validUser(opts).getAsObject();
  },
  createAppWithSession = function (app, sessionData) {
    var proxyApp = express();
    proxyApp.all("*", function (req, res, next) {
      sessionData.destroy = sinon.stub();
      req.session = sessionData || {};
      next();
    });
    proxyApp.use(app);
    return proxyApp;
  },

  getAppWithLoggedInUser = function (app, user) {
    var validSession = getMockSession(user);
    return createAppWithSession(app, validSession);
  },

  getAppWithSession = function (app, sessionData) {
    return createAppWithSession(app, sessionData);
  },

  getAppWithSessionWithoutSecondFactor = function (app, user) {
    var session = getMockSession(user);
    delete session.secondFactor;

    return createAppWithSession(app, session);
  },

  getMockSession = function (user) {
    return _.cloneDeep({
      csrfSecret: "123",
      12345: {refunded_amount: 5},
      passport: {
        user: user,
      },
      secondFactor: 'totp',
      last_url:'last_url',
      version: user.sessionVersion
    });
  };

module.exports = {
  getAppWithLoggedInUser: getAppWithLoggedInUser,
  getAppWithSession: getAppWithSession,
  getMockSession: getMockSession,
  getUser: getUser,
  getAppWithSessionWithoutSecondFactor: getAppWithSessionWithoutSecondFactor
};





