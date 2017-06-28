'use strict';
var express = require('express');
var _ = require('lodash');
var sinon = require('sinon');
var userFixture = require('../fixtures/user_fixtures');
var getUser = (opts) => {
    return userFixture.validUser(opts).getAsObject();
  },

  createAppWithSession = function (app, sessionData, gatewayAccountData, registerInviteData) {
    var proxyApp = express();
    proxyApp.all("*", function (req, res, next) {
      sessionData.destroy = sinon.stub();
      req.session = sessionData || {};
      req.gateway_account = gatewayAccountData || {};
      req.register_invite = registerInviteData || {};
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

  getAppWithSessionAndGatewayAccountCookies = function (app, sessionData, gatewayAccountData) {
    return createAppWithSession(app, sessionData, gatewayAccountData);
  },

  getAppWithRegisterInvitesCookie = function (app, registerInviteData) {
    return createAppWithSession(app, {csrfSecret: "123"}, {}, registerInviteData);
  },

  getAppWithLoggedOutSession = function (app) {
    return createAppWithSession(app, {csrfSecret: "123"}, {});
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
      last_url: 'last_url',
      version: user.sessionVersion
    });
  };

module.exports = {
  createAppWithSession:createAppWithSession,
  getAppWithLoggedInUser: getAppWithLoggedInUser,
  getAppWithSessionAndGatewayAccountCookies: getAppWithSessionAndGatewayAccountCookies,
  getMockSession: getMockSession,
  getUser: getUser,
  getAppWithSessionWithoutSecondFactor: getAppWithSessionWithoutSecondFactor,
  getAppWithRegisterInvitesCookie: getAppWithRegisterInvitesCookie,
  getAppWithLoggedOutSession: getAppWithLoggedOutSession
};
