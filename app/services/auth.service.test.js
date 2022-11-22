'use strict'

const path = require('path')
const assert = require('assert')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const _ = require('lodash')
const { expect } = require('chai')

const auth = require('./auth.service.js')
const paths = require('../paths.js')
const mockSession = require('../../test/test-helpers/mock-session.js')
const userFixtures = require('../../test/fixtures/user.fixtures')
const User = require('../models/User.class')
const secondFactorMethod = require('../models/second-factor-method')

// Assignments and Variables
const EXTERNAL_ID_IN_SESSION = '7d19aff33f8948deb97ed16b2912dcd3'
const mockUser = opts => mockSession.getUser(opts)
const mockByPass = next => next()
const response = { status: () => {}, render: () => {}, redirect: () => {} }
const validRequest = () => {
  return {
    session: {
      secondFactor: 'totp',
      passport: {
        user: {
          name: 'Michael',
          gateway_account_ids: [123]
        }
      },
      reload: mockByPass,
      save: mockByPass,
      version: 0
    },
    user: mockUser(),
    headers: {}
  }
}
let status, render, next, redirect

describe('auth service', function () {
  beforeEach(function () {
    status = sinon.stub(response, 'status')
    render = sinon.stub(response, 'render')
    redirect = sinon.stub(response, 'redirect')

    next = sinon.spy()
  })

  afterEach(function () {
    status.restore()
    render.restore()
    redirect.restore()
  })

  describe('serialize user', function () {
    it('should call done function with externalId', function (done) {
      const user = { externalId: EXTERNAL_ID_IN_SESSION }
      const doneSpy = sinon.spy(done)

      auth.serializeUser(user, doneSpy)

      assert(doneSpy.calledWithExactly(null, EXTERNAL_ID_IN_SESSION))
    })
  })

  describe('deserialize user', function () {
    it('should find user by external id', function (done) {
      const authService = (userMock) => {
        return proxyquire(path.join(__dirname, '/./auth.service.js'),
          {
            './user.service.js': userMock,
            'continuation-local-storage': {
              getNamespace: function () {
                return {
                  run: function (callback) {
                    callback()
                  },
                  set: () => {}
                }
              }
            }
          })
      }

      const user = mockUser()
      const userServiceMock = {
        findByExternalId: (externalId) => {
          return new Promise(function (resolve, reject) {
            expect(externalId).to.be.equal(EXTERNAL_ID_IN_SESSION)
            resolve(user)
          })
        }
      }

      authService(userServiceMock).deserializeUser({ headers: { 'x-request-id': 'foo' } }, EXTERNAL_ID_IN_SESSION, function (err, returnedUser) {
        expect(err).to.be.null //eslint-disable-line
        expect(returnedUser).to.deep.equal(user)
        done()
      })
    })
  })

  describe('ensureNotDisabled', function () {
    it('should call lockout user when user has a truthy disabled property', function (done) {
      const user = mockSession.getUser({ disabled: true })
      const nextSpy = sinon.spy()

      auth.lockOutDisabledUsers({ user: user, headers: {} }, response, nextSpy)
      assert(nextSpy.notCalled)
      assert(response.redirect.calledWithExactly('/noaccess'))
      done()
    })

    it('should just call next when user has a falsey disabled property', function (done) {
      const user = mockSession.getUser({ disabled: false })
      const nextSpy = sinon.spy()

      auth.lockOutDisabledUsers({ user: user, headers: {} }, response, nextSpy)
      assert(nextSpy.called)
      assert(response.render.notCalled)
      done()
    })
  })

  describe('noAccess', function () {
    it('call next when on no access', function (done) {
      const invalid = _.cloneDeep(validRequest())
      invalid.url = paths.user.noAccess
      auth.noAccess(invalid, response, next)
      expect(next.calledOnce).to.be.true // eslint-disable-line
      done()
    })

    it('call redirect to no access', function (done) {
      auth.noAccess(validRequest(), response, next)
      assert(redirect.calledWith(paths.user.noAccess))
      done()
    })
  })

  describe('localStrategyAuth', function () {
    it('should return user when authenticates successfully', function (done) {
      const authService = (userMock) => {
        return proxyquire(path.join(__dirname, '/./auth.service.js'),
          { './user.service.js': userMock })
      }
      const req = {
        headers: { 'x-request-id': 'corrId' }
      }
      const user = { username: 'user@example.com' }
      const password = 'correctPassword'
      const doneSpy = sinon.spy(() => {
      })
      const userServiceMock = {
        authenticate: (username, password) => {
          return new Promise(function (resolve, reject) {
            expect(username).to.be.equal(user.username)
            expect(password).to.be.equal('correctPassword')
            resolve(user)
          })
        }
      }

      authService(userServiceMock).localStrategyAuth(req, user.username, password, doneSpy)
        .then(() => {
          assert(doneSpy.calledWithExactly(null, user))
          done()
        })
    })

    it('should return error message when authentication fails', function (done) {
      const authService = (userMock) => {
        return proxyquire(path.join(__dirname, '/./auth.service.js'),
          { './user.service.js': userMock })
      }
      const req = {
        headers: { 'x-request-id': 'corrId' }
      }
      const username = 'user@example.com'
      const password = 'imagineThisIsInvalid'
      const doneSpy = sinon.spy(() => {
      })
      const userServiceMock = {
        authenticate: (username, password) => {
          return new Promise(function (resolve, reject) {
            expect(username).to.be.equal('user@example.com')
            expect(password).to.be.equal('imagineThisIsInvalid')
            reject(new Error())
          })
        }
      }

      authService(userServiceMock).localStrategyAuth(req, username, password, doneSpy)
        .then(() => {
          assert(doneSpy.calledWithExactly(null, false, { message: 'Invalid email or password' }))
          done()
        })
    })
  })

  describe('localStrategy2Fa', () => {
    it('should call done with error when code does not pass validation', async () => {
      const user = new User(userFixtures.validUserResponse())
      const doneSpy = sinon.spy(() => {})
      const req = {
        user,
        body: {
          code: '1'
        }
      }

      await auth.localStrategy2Fa(req, doneSpy)
      sinon.assert.calledWith(doneSpy, null, false, {
        message: 'You’ve not entered enough numbers, the code must be 6 numbers'
      })
    })

    it('should call done with user when authenticates successfully', async () => {
      const user = new User(userFixtures.validUserResponse())
      const authenticateSecondFactorSpy = sinon.spy(() => Promise.resolve(user))
      const doneSpy = sinon.spy(() => {})

      const authService = proxyquire('./auth.service.js', {
        './user.service.js': {
          authenticateSecondFactor: authenticateSecondFactorSpy
        }
      })

      const inputOtpCode = '123 456'
      const expectedSanitisedCode = '123456'
      const req = {
        user,
        body: {
          code: inputOtpCode
        }
      }

      await authService.localStrategy2Fa(req, doneSpy)
      sinon.assert.calledWith(authenticateSecondFactorSpy, user.externalId, expectedSanitisedCode)
      sinon.assert.calledWith(doneSpy, null, user)
    })

    it('should call done with error when authentication fails for user with SMS second factor method', async () => {
      const user = new User(userFixtures.validUserResponse({
        second_factor: secondFactorMethod.SMS
      }))
      const authenticateSecondFactorSpy = sinon.spy(() => Promise.reject(new Error()))
      const doneSpy = sinon.spy(() => {})

      const authService = proxyquire('./auth.service.js', {
        './user.service.js': {
          authenticateSecondFactor: authenticateSecondFactorSpy
        }
      })

      const otpCode = '123456'
      const req = {
        user,
        body: {
          code: otpCode
        }
      }

      await authService.localStrategy2Fa(req, doneSpy)
      sinon.assert.calledWith(authenticateSecondFactorSpy, user.externalId, otpCode)
      sinon.assert.calledWith(doneSpy, null, false, {
        message: 'The security code you’ve used is incorrect or has expired'
      })
    })

    it('should call done with error when authentication fails for user with APP second factor method', async () => {
      const user = new User(userFixtures.validUserResponse({
        second_factor: secondFactorMethod.APP
      }))
      const authenticateSecondFactorSpy = sinon.spy(() => Promise.reject(new Error()))
      const doneSpy = sinon.spy(() => {})

      const authService = proxyquire('./auth.service.js', {
        './user.service.js': {
          authenticateSecondFactor: authenticateSecondFactorSpy
        }
      })

      const otpCode = '123456'
      const req = {
        user,
        body: {
          code: otpCode
        }
      }

      await authService.localStrategy2Fa(req, doneSpy)
      sinon.assert.calledWith(authenticateSecondFactorSpy, user.externalId, otpCode)
      sinon.assert.calledWith(doneSpy, null, false, {
        message: 'The security code you entered is not correct, try entering it again or wait for your authenticator app to give you a new code'
      })
    })
  })

  describe('localDirectStrategy', function () {
    it('should successfully mark a user as second factor authenticated', function (done) {
      const authService = (userMock) => {
        return proxyquire(path.join(__dirname, '/./auth.service.js'),
          { './user.service.js': userMock })
      }
      const user = { username: 'user@example.com', sessionVersion: 1 }
      const doneSpy = sinon.spy()
      const registerInviteCookie = {
        userExternalId: '874riuwhf',
        destroy: sinon.spy()
      }
      const req = {
        headers: { 'x-request-id': 'corrId' },
        register_invite: registerInviteCookie,
        user: user,
        session: {}
      }
      const userServiceMock = {
        findByExternalId: () => {
          return new Promise(function (resolve, reject) {
            resolve(user)
          })
        }
      }

      authService(userServiceMock).localDirectStrategy(req, doneSpy)
        .then(() => {
          expect(registerInviteCookie.destroy.called).to.equal(true)
          expect(req.session.secondFactor).to.equal('totp')
          expect(doneSpy.calledWithExactly(null, user)).to.equal(true)
          expect(req.session.version).to.equal(1)
          done()
        })
        .catch(done)
    })
  })

  describe('redirectLoggedInUser', function (done) {
    it('should redirect a user with a valid session to the index path', function (done) {
      const req = _.cloneDeep(validRequest())
      auth.redirectLoggedInUser(req, response, next)
      expect(next.called).to.be.false // eslint-disable-line
      assert(redirect.calledWith(paths.index))
      done()
    })

    it('should call next if user is not logged in', function (done) {
      let invalidSession = validRequest()
      invalidSession.session.version = 1
      auth.redirectLoggedInUser(invalidSession, response, next)
      expect(next.calledOnce).to.be.true // eslint-disable-line
      done()
    })
  })
})
