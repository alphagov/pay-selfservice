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
const secondFactorMethod = require('@models/constants/second-factor-method')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')
const { validationErrors } = require('@utils/validation/field-validation-checks')

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
    it('should call done function with externalId', function () {
      const user = { externalId: EXTERNAL_ID_IN_SESSION }
      const doneSpy = sinon.spy()
      auth.serializeUser(user, doneSpy)
      sinon.assert.calledWithExactly(doneSpy, null, EXTERNAL_ID_IN_SESSION)
    })
  })

  describe('deserialize user', function () {
    it('should find user by external id', function (done) {
      const user = mockUser()
      const userServiceMock = {
        findByExternalId: (externalId) => {
          return new Promise(function (resolve, reject) {
            expect(externalId).to.be.equal(EXTERNAL_ID_IN_SESSION)
            resolve(user)
          })
        }
      }
      const doneSpy = sinon.spy((err, returnedUser) => {
        try {
          expect(err).to.be.null
          expect(returnedUser).to.deep.equal(user)
          done()
        } catch (err) {
          done(err)
        }
      })
      getServiceWithMockedUserService(userServiceMock).deserializeUser(EXTERNAL_ID_IN_SESSION, doneSpy)
    })
  })

  describe('noAccess', function () {
    it('call next when on no access', function () {
      const invalid = _.cloneDeep(validRequest())
      invalid.url = paths.user.noAccess
      auth.noAccess(invalid, response, next)
      sinon.assert.calledOnce(next)
    })

    it('call redirect to no access', function () {
      auth.noAccess(validRequest(), response, next)
      sinon.assert.calledWithExactly(redirect, paths.user.noAccess)
    })
  })

  describe('localStrategyAuth', function () {
    it('should return user when authenticates successfully', function (done) {
      const req = {
        headers: { 'x-request-id': 'corrId' }
      }
      const user = { username: 'user@example.com' }
      const password = 'correctPassword'
      const doneSpy = sinon.spy(() => {
        try {
          sinon.assert.calledWithExactly(doneSpy, null, user)
          done()
        } catch (error) {
          done(error)
        }
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

      getServiceWithMockedUserService(userServiceMock).localStrategyAuth(user.username, password, doneSpy)
    })

    it('should return error message when authentication fails', function (done) {
      const req = {
        headers: { 'x-request-id': 'corrId' }
      }
      const email = 'user@example.com'
      const password = 'imagineThisIsInvalid'
      const doneSpy = sinon.spy(() => {
        try {
          sinon.assert.calledWithExactly(doneSpy, null, false, { message: 'Invalid email or password' })
          done()
        } catch (error) {
          done(error)
        }
      })
      const userServiceMock = {
        authenticate: (email, password) => {
          return new Promise(function (resolve, reject) {
            expect(email).to.be.equal('user@example.com')
            expect(password).to.be.equal('imagineThisIsInvalid')
            reject(new Error())
          })
        }
      }
      getServiceWithMockedUserService(userServiceMock).localStrategyAuth(email, password, doneSpy)
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
        '@services/user.service.js': {
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

    it('should call done with error when authentication fails for user with SMS second factor method', (done) => {
      const user = new User(userFixtures.validUserResponse({
        second_factor: secondFactorMethod.SMS
      }))
      const authenticateSecondFactorSpy = sinon.spy(() => Promise.reject(new Error()))

      const doneSpy = sinon.spy(() => {
        try {
          sinon.assert.calledWith(authenticateSecondFactorSpy, user.externalId, otpCode)
          sinon.assert.calledWith(doneSpy, null, false, {
            message: validationErrors.invalidOrExpiredSecurityCodeSMS
          })
          done()
        } catch (error) {
          done(error)
        }
      })

      const authService = proxyquire('./auth.service.js', {
        '@services/user.service.js': {
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

      authService.localStrategy2Fa(req, doneSpy)
    })

    it('should call done with error when authentication fails for user with APP second factor method', (done) => {
      const user = new User(userFixtures.validUserResponse({
        second_factor: secondFactorMethod.APP
      }))
      const authenticateSecondFactorSpy = sinon.spy(() => Promise.reject(new Error()))
      const doneSpy = sinon.spy(() => {
        try {
          sinon.assert.calledWith(authenticateSecondFactorSpy, user.externalId, otpCode)
          sinon.assert.calledWith(doneSpy, null, false, {
            message: validationErrors.invalidOrExpiredSecurityCodeApp
          })
          done()
        } catch (error) {
          done(error)
        }
      })

      const authService = proxyquire('./auth.service.js', {
        '@services/user.service.js': {
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

      authService.localStrategy2Fa(req, doneSpy)
    })
  })

  describe('localStrategyLoginDirectAfterRegistration', () => {
    it('should successfully mark a user as second factor authenticated', (done) => {
      const userExternalId = 'a-user-external-id'
      const user = { username: 'user@example.com', sessionVersion: 1 }
      const doneSpy = sinon.spy(() => {
        try {
          sinon.assert.calledWith(findByExternalIdSpy, userExternalId)
          sinon.assert.called(registerInviteCookie.destroy)
          sinon.assert.calledWithExactly(doneSpy, null, user)
          expect(req.session.secondFactor).to.equal('totp')
          expect(req.session.version).to.equal(1)
          done()
        } catch (err) {
          done(err)
        }
      })
      const registerInviteCookie = {
        userExternalId,
        destroy: sinon.spy()
      }
      const req = {
        headers: { 'x-request-id': 'corrId' },
        register_invite: registerInviteCookie,
        user,
        session: {}
      }

      const findByExternalIdSpy = sinon.spy(() => Promise.resolve(user))
      const userServiceMock = {
        findByExternalId: findByExternalIdSpy
      }

      getServiceWithMockedUserService(userServiceMock).localStrategyLoginDirectAfterRegistration(req, doneSpy)
    })

    it('should call the callback with no user when the registration cookie is not present', (done) => {
      const req = {
        session: {}
      }
      const doneSpy = sinon.spy(() => {
        try {
          sinon.assert.calledWith(doneSpy, null, false)
          expect(req.session).to.not.have.property('secondFactor')
          done()
        } catch (err) {
          done(err)
        }
      })
      auth.localStrategyLoginDirectAfterRegistration(req, doneSpy)
    })

    it('should call the callback with no user when the registration cookie does not have userExternalId set', (done) => {
      const req = {
        session: {},
        register_invite: {}
      }
      const doneSpy = sinon.spy(() => {
        try {
          sinon.assert.calledWith(doneSpy, null, false)
          expect(req.session).to.not.have.property('secondFactor')
          done()
        } catch (err) {
          done(err)
        }
      })
      auth.localStrategyLoginDirectAfterRegistration(req, doneSpy)
    })

    it('should call the callback when adminusers returns an error', (done) => {
      const userExternalId = 'a-user-external-id'
      const registerInviteCookie = {
        userExternalId,
        destroy: sinon.spy()
      }
      const req = {
        session: {},
        register_invite: registerInviteCookie
      }
      const doneSpy = sinon.spy(() => {
        try {
          sinon.assert.calledWith(findByExternalIdSpy, userExternalId)
          sinon.assert.called(registerInviteCookie.destroy)
          sinon.assert.calledWith(doneSpy, null, false)
          expect(req.session).to.not.have.property('secondFactor')
          done()
        } catch (err) {
          done(err)
        }
      })

      const error = new RESTClientError('Error', 'adminusers', 500)
      const findByExternalIdSpy = sinon.spy(() => Promise.reject(error))
      const userServiceMock = {
        findByExternalId: findByExternalIdSpy
      }

      getServiceWithMockedUserService(userServiceMock).localStrategyLoginDirectAfterRegistration(req, doneSpy)
    })
  })

  describe('redirectLoggedInUser', function (done) {
    it('should redirect a user with a valid session to the index path', function () {
      const req = _.cloneDeep(validRequest())
      auth.redirectLoggedInUser(req, response, next)
      sinon.assert.notCalled(next)
      sinon.assert.calledWith(redirect, paths.index)
    })

    it('should call next if user is not logged in', function () {
      const invalidSession = validRequest()
      invalidSession.session.version = 1
      auth.redirectLoggedInUser(invalidSession, response, next)
      sinon.assert.calledOnce(next)
    })
  })
})

function getServiceWithMockedUserService (userServiceMock) {
  return proxyquire(path.join(__dirname, '/./auth.service.js'),
    { '@services/user.service.js': userServiceMock })
}
