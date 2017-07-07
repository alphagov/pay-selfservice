'use strict'

// NPM dependencies
const express = require('express')
const _ = require('lodash')
const sinon = require('sinon')

// Custom dependencies
const userFixture = require('../fixtures/user_fixtures')

const getUser = (opts) => {
    return userFixture.validUser(opts).getAsObject()
  },

  createAppWithSession = function (app, sessionData, gatewayAccountData, registerInviteData) {
    const proxyApp = express()
    proxyApp.all('*', function (req, res, next) {
      sessionData.destroy = sinon.stub()
      req.session = sessionData || {}
      req.gateway_account = gatewayAccountData || {}
      req.register_invite = registerInviteData || {}
      next()
    })
    proxyApp.use(app)
    return proxyApp
  },

  getAppWithLoggedInUser = function (app, user) {
    const validSession = getMockSession(user)
    return createAppWithSession(app, validSession)
  },

  getAppWithSessionAndGatewayAccountCookies = function (app, sessionData, gatewayAccountData) {
    return createAppWithSession(app, sessionData, gatewayAccountData)
  },

  getAppWithRegisterInvitesCookie = function (app, registerInviteData) {
    return createAppWithSession(app, {csrfSecret: '123'}, {}, registerInviteData)
  },

  getAppWithLoggedOutSession = function (app, session) {
    session = session || {}
    session.csrfSecret = '123'
    return createAppWithSession(app, session, {})
  },

  getAppWithSessionWithoutSecondFactor = function (app, user) {
    const session = getMockSession(user)
    delete session.secondFactor

    return createAppWithSession(app, session)
  },

  getMockSession = function (user) {
    return _.cloneDeep({
      csrfSecret: '123',
      12345: {refunded_amount: 5},
      passport: {
        user: user,
      },
      secondFactor: 'totp',
      last_url: 'last_url',
      version: user.sessionVersion
    })
  }

module.exports = {
  createAppWithSession: createAppWithSession,
  getAppWithLoggedInUser: getAppWithLoggedInUser,
  getAppWithSessionAndGatewayAccountCookies: getAppWithSessionAndGatewayAccountCookies,
  getMockSession: getMockSession,
  getUser: getUser,
  getAppWithSessionWithoutSecondFactor: getAppWithSessionWithoutSecondFactor,
  getAppWithRegisterInvitesCookie: getAppWithRegisterInvitesCookie,
  getAppWithLoggedOutSession: getAppWithLoggedOutSession
}
