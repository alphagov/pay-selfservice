'use strict'

// NPM Dependencies
const path = require('path')
const assert = require('assert')
const AWSXRay = require('aws-xray-sdk')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const _ = require('lodash')
const {expect} = require('chai')

// Local Dependencies
const auth = require('../../../app/services/auth_service.js')
const paths = require('../../../app/paths.js')
const mockSession = require('../../test_helpers/mock_session.js')

// Assignments and Variables
const EXTERNAL_ID_IN_SESSION = '7d19aff33f8948deb97ed16b2912dcd3'
const mockUser = opts => mockSession.getUser(opts)
const mockByPass = next => next()
const response = {status: () => {}, render: () => {}, redirect: () => {}}
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
      const user = {externalId: EXTERNAL_ID_IN_SESSION}
      const doneSpy = sinon.spy(done)

      auth.serializeUser(user, doneSpy)

      assert(doneSpy.calledWithExactly(null, EXTERNAL_ID_IN_SESSION))
    })
  })

  describe('deserialize user', function () {
    it('should find user by external id', function (done) {
      const authService = (userMock) => {
        return proxyquire(path.join(__dirname, '/../../../app/services/auth_service.js'),
          {'./user_service.js': userMock,
            'aws-xray-sdk': {
              captureAsyncFunc: function (name, callback) {
                callback(new AWSXRay.Segment('stub-subsegment'))
              }
            },
            'continuation-local-storage': {
              getNamespace: function () {
                return {
                  run: function(callback) {
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

      authService(userServiceMock).deserializeUser({headers: {'x-request-id': 'foo'}}, EXTERNAL_ID_IN_SESSION, function(err, returnedUser) {
        expect(err).to.be.null
        expect(returnedUser).to.deep.equal(user)
        done()
      })
    })
  })

  describe('enforceUserAndSecondFactor', function () {
    it('should call next if has valid user', function (done) {
      auth.enforceUserAuthenticated(validRequest(), response, next)
      expect(next.calledOnce).to.be.true // eslint-disable-line
      done()
    })

    it('should not call next if has a disabled user', function (done) {
      const invalid = _.cloneDeep(validRequest())
      invalid.user.disabled = true
      auth.enforceUserAuthenticated(invalid, response, next)
      expect(next.called).to.be.false // eslint-disable-line
      assert(redirect.calledWith(paths.user.noAccess))
      done()
    })
  })

  describe('ensureNotDisabled', function () {
    it('should call lockout user when user has a truthy disabled property', function (done) {
      const user = mockSession.getUser({disabled: true})
      const nextSpy = sinon.spy()

      auth.lockOutDisabledUsers({user: user, headers: {}}, response, nextSpy)
      assert(nextSpy.notCalled)
      assert(response.redirect.calledWithExactly('/noaccess'))
      done()
    })

    it('should just call next when user has a falsey disabled property', function (done) {
      const user = mockSession.getUser({disabled: false})
      const nextSpy = sinon.spy()

      auth.lockOutDisabledUsers({user: user, headers: {}}, response, nextSpy)
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
        return proxyquire(path.join(__dirname, '/../../../app/services/auth_service.js'),
          {'./user_service.js': userMock})
      }
      const req = {
        headers: {'x-request-id': 'corrId'}
      }
      const user = {username: 'user@example.com'}
      const password = 'correctPassword'
      const doneSpy = sinon.spy(() => {
      })
      const userServiceMock = {
        authenticate: (username, password, correlationId) => {
          return new Promise(function (resolve, reject) {
            expect(username).to.be.equal(user.username)
            expect(password).to.be.equal('correctPassword')
            expect(correlationId).to.be.equal('corrId')
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
        return proxyquire(path.join(__dirname, '/../../../app/services/auth_service.js'),
          {'./user_service.js': userMock})
      }
      const req = {
        headers: {'x-request-id': 'corrId'}
      }
      const username = 'user@example.com'
      const password = 'imagineThisIsInvalid'
      const doneSpy = sinon.spy(() => {
      })
      const userServiceMock = {
        authenticate: (username, password, correlationId) => {
          return new Promise(function (resolve, reject) {
            expect(username).to.be.equal('user@example.com')
            expect(password).to.be.equal('imagineThisIsInvalid')
            expect(correlationId).to.be.equal('corrId')
            reject(new Error())
          })
        }
      }

      authService(userServiceMock).localStrategyAuth(req, username, password, doneSpy)
        .then(() => {
          assert(doneSpy.calledWithExactly(null, false, {message: 'Invalid email or password'}))
          done()
        })
    })
  })

  describe('localDirectStrategy', function () {
    it('should successfully mark a user as second factor authenticated', function (done) {
      const authService = (userMock) => {
        return proxyquire(path.join(__dirname, '/../../../app/services/auth_service.js'),
          {'./user_service.js': userMock})
      }
      const user = {username: 'user@example.com', sessionVersion: 1}
      const doneSpy = sinon.spy()
      const registerInviteCookie = {
        userExternalId: '874riuwhf',
        destroy: sinon.spy()
      }
      const req = {
        headers: {'x-request-id': 'corrId'},
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

  describe('getCurrentGatewayAccountId', function () {
    it('should return first gateway_account_id if user has multiple gateway accounts if its undefined in cookie', function (done) {
      const req = {
        service: {
          gatewayAccountIds: ['1', '2']
        }
      }
      const test = auth.getCurrentGatewayAccountId(req)
      assert.equal(test, 1)
      assert.equal(req.gateway_account.currentGatewayAccountId, 1)
      done()
    })

    it('should return first gateway_account_id if user has multiple gateway accounts if its empty object in cookie', function (done) {
      const req = {
        gateway_account: {},
        service: {
          gatewayAccountIds: ['1', '2']
        }
      }
      const test = auth.getCurrentGatewayAccountId(req)
      assert.equal(test, 1)
      assert.equal(req.gateway_account.currentGatewayAccountId, 1)
      done()
    })

    it('should return first gateway_account_id if user has multiple gateway accounts if its null value in cookie', function (done) {
      const req = {
        gateway_account: {
          currentGatewayAccountId: null
        },
        service: {
          gatewayAccountIds: ['1', '2']
        }
      }
      const test = auth.getCurrentGatewayAccountId(req)
      assert.equal(test, 1)
      assert.equal(req.gateway_account.currentGatewayAccountId, 1)
      done()
    })

    it('should return first gateway_account_id if user has invalid currentGatewayAccountId cookie value', function (done) {
      const req = {
        gateway_account: {
          currentGatewayAccountId: '777'
        },
        service: {
          gatewayAccountIds: ['1', '2', '3']
        }
      }
      const test = auth.getCurrentGatewayAccountId(req)

      expect(test).to.equal('1')
      expect(req.gateway_account.currentGatewayAccountId).to.equal('1')

      done()
    })

    it('should return gateway_account_id from cookie', function (done) {
      const req = {
        gateway_account: {
          currentGatewayAccountId: '3'
        },
        service: {
          gatewayAccountIds: ['1', '2', '3']
        }
      }
      const test = auth.getCurrentGatewayAccountId(req)
      assert.equal(test, 3)
      assert.equal(req.gateway_account.currentGatewayAccountId, 3)
      done()
    })

    it('should not return gateway_account_id', function (done) {
      const test1 = auth.getCurrentGatewayAccountId({session: {passport: {user: {}}}})
      const test2 = auth.getCurrentGatewayAccountId({session: {passport: {}}})
      const test3 = auth.getCurrentGatewayAccountId({session: {}})
      const test4 = auth.getCurrentGatewayAccountId({})

      assert.equal(test1, null)
      assert.equal(test2, null)
      assert.equal(test3, null)
      assert.equal(test4, null)
      done()
    })
  })

  describe('redirectLoggedInUser', function (done) {
    it('should redirect a user with a valid session to the dashboard.index path', function (done) {
      const req = _.cloneDeep(validRequest())
      auth.redirectLoggedInUser(req, response, next)
      expect(next.called).to.be.false // eslint-disable-line
      assert(redirect.calledWith(paths.dashboard.index))
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
