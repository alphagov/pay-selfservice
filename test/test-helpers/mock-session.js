'use strict'

const express = require('express')
const _ = require('lodash')
const sinon = require('sinon')

const User = require('../../app/models/User.class')
const userFixtures = require('../fixtures/user.fixtures')

const getUser = (opts) => {
  return new User(userFixtures.validUser(opts))
}

const createAppWithSession = function (app, sessionData, registerInviteData) {
  const proxyApp = express()
  proxyApp.all('*', function (req, res, next) {
    sessionData.destroy = sinon.stub()
    req.session = req.session || sessionData || {}
    req.register_invite = registerInviteData || {}

    next()
  })
  proxyApp.use(app)
  return proxyApp
}

const getAppWithLoggedInUser = function (app, user) {
  const validSession = getMockSession(user)
  return createAppWithSession(app, validSession)
}

const getAppWithSessionData = function (app, sessionData) {
  return createAppWithSession(app, sessionData, null)
}

const getAppWithRegisterInvitesCookie = function (app, registerInviteData) {
  return createAppWithSession(app, { csrfSecret: '123' }, registerInviteData)
}

const getAppWithLoggedOutSession = function (app, session) {
  session = session || {}
  session.csrfSecret = '123'
  return createAppWithSession(app, session, null)
}

const getAppWithSessionWithoutSecondFactor = function (app, user) {
  const session = getMockSession(user)
  delete session.secondFactor

  return createAppWithSession(app, session, null)
}

const getMockSession = function (user) {
  return _.cloneDeep({
    csrfSecret: '123',
    12345: { refunded_amount: 5 },
    passport: {
      user
    },
    secondFactor: 'totp',
    last_url: 'last_url',
    version: user.sessionVersion
  })
}

module.exports = {
  createAppWithSession,
  getAppWithLoggedInUser,
  getAppWithSessionData,
  getMockSession,
  getUser,
  getAppWithSessionWithoutSecondFactor,
  getAppWithRegisterInvitesCookie,
  getAppWithLoggedOutSession
}
