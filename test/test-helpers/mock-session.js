'use strict'

const express = require('express')
const _ = require('lodash')
const sinon = require('sinon')

const User = require('../../app/models/User.class')
const userFixtures = require('../fixtures/user.fixtures')

const getUser = (opts) => {
  return new User(userFixtures.validUser(opts))
}

const createAppWithSession = function (app, sessionData, hasGatewayAccountCookie, registerInviteData) {
  const proxyApp = express()
  proxyApp.all('*', function (req, res, next) {
    sessionData.destroy = sinon.stub()
    req.session = req.session || sessionData || {}
    req.register_invite = registerInviteData || {}
    if (hasGatewayAccountCookie) {
      req.gateway_account = {
        currentGatewayAccountId: _.get(sessionData, 'passport.user.serviceRoles[0].service.gatewayAccountIds[0]'),
        currentGatewayAccountExternalId: 'external-id-set-by-create-app-with-session'
      }
    }

    next()
  })
  proxyApp.use(app)
  return proxyApp
}

const getAppWithLoggedInUser = function (app, user) {
  const validSession = getMockSession(user)
  return createAppWithSession(app, validSession, false)
}

const getAppWithLoggedInUserWithGatewayAccountCookie = function (app, user) {
  const validSession = getMockSession(user)
  return createAppWithSession(app, validSession, true)
}

const getAppWithSessionData = function (app, sessionData) {
  return createAppWithSession(app, sessionData, false, null)
}

const getAppWithRegisterInvitesCookie = function (app, registerInviteData) {
  return createAppWithSession(app, { csrfSecret: '123' }, false, registerInviteData)
}

const getAppWithLoggedOutSession = function (app, session) {
  session = session || {}
  session.csrfSecret = '123'
  return createAppWithSession(app, session, false, null)
}

const getAppWithSessionWithoutSecondFactor = function (app, user) {
  const session = getMockSession(user)
  delete session.secondFactor

  return createAppWithSession(app, session, false, null)
}

const getMockSession = function (user) {
  return _.cloneDeep({
    csrfSecret: '123',
    12345: { refunded_amount: 5 },
    passport: {
      user: user
    },
    secondFactor: 'totp',
    last_url: 'last_url',
    version: user.sessionVersion
  })
}

module.exports = {
  createAppWithSession,
  getAppWithLoggedInUser,
  getAppWithLoggedInUserWithGatewayAccountCookie,
  getAppWithSessionData,
  getMockSession,
  getUser,
  getAppWithSessionWithoutSecondFactor,
  getAppWithRegisterInvitesCookie,
  getAppWithLoggedOutSession
}
