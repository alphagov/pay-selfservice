'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const paths = require('../../../app/paths')

// Constants
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('otp-verify middleware', function () {
  let loggerDebugSpy = sinon.spy()
  let loggerWarnSpy = sinon.spy()
  let renderErrorViewSpy = sinon.spy()
  let submitServiceInviteOtpCodeSpy = sinon.spy()
  let reqFlashSpy = sinon.spy()
  let resRedirectSpy = sinon.spy()

  let proxyquireObject, otpVerify
  let req, res

  beforeEach(() => {
    req = {
      correlationId: 'a-correlationId',
      register_invite: {
        code: 'a-code',
        email: 'a-user@gov.uk'
      },
      body: {
        email: 'user@gov.uk',
        'telephone-number': '07451234567',
        password: 'password1234',
        'verify-code': '123456'
      },
      flash: reqFlashSpy
    }
    res = {
      redirect: resRedirectSpy
    }

    proxyquireObject = {
      '../utils/logger': () => {
        return {
          debug: loggerDebugSpy,
          warn: loggerWarnSpy
        }
      },
      '../utils/response': {
        renderErrorView: renderErrorViewSpy
      },
      '../services/service-registration.service': {
        submitServiceInviteOtpCode: submitServiceInviteOtpCodeSpy
      }
    }
    otpVerify = proxyquire('../../../app/middleware/otp-verify', proxyquireObject)
  })

  afterEach(() => {
    loggerDebugSpy = sinon.spy()
    loggerWarnSpy = sinon.spy()
    renderErrorViewSpy = sinon.spy()
    submitServiceInviteOtpCodeSpy = sinon.spy()
    reqFlashSpy = sinon.spy()
    resRedirectSpy = sinon.spy()
  })

  it('should call next on valid otp code', function (done) {
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(next.called).to.be.true // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle invalid otp validation', function (done) {
    req.body['verify-code'] = 'invalid-otp'
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(loggerDebugSpy.calledWith(`[requestId=${req.correlationId}] invalid user input - otp code`)).to.equal(true)
      expect(reqFlashSpy.calledWith('genericError', 'Invalid verification code')).to.equal(true)
      expect(resRedirectSpy.calledWith(303, paths.selfCreateService.otpVerify)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle 401 server error', function (done) {
    proxyquireObject['../services/service-registration.service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      const error = new Error()
      error.errorCode = 401
      return Promise.reject(error)
    }
    otpVerify = proxyquire('../../../app/middleware/otp-verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(loggerDebugSpy.calledWith(`[requestId=${req.correlationId}] invalid user input - otp code`)).to.equal(true)
      expect(reqFlashSpy.calledWith('genericError', 'Invalid verification code')).to.equal(true)
      expect(resRedirectSpy.calledWith(303, paths.selfCreateService.otpVerify)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle 404 server error', function (done) {
    proxyquireObject['../services/service-registration.service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      const error = new Error()
      error.errorCode = 404
      return Promise.reject(error)
    }
    otpVerify = proxyquire('../../../app/middleware/otp-verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(renderErrorViewSpy.calledWith(req, res, 'Unable to process registration at this time', 404)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle 410 server error', function (done) {
    proxyquireObject['../services/service-registration.service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      const error = new Error()
      error.errorCode = 410
      return Promise.reject(error)
    }
    otpVerify = proxyquire('../../../app/middleware/otp-verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(renderErrorViewSpy.calledWith(req, res, 'This invitation is no longer valid', 410)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle 500 server error', function (done) {
    proxyquireObject['../services/service-registration.service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      const error = new Error()
      error.errorCode = 500
      return Promise.reject(error)
    }
    otpVerify = proxyquire('../../../app/middleware/otp-verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(renderErrorViewSpy.calledWith(req, res, 'Unable to process registration at this time', 500)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })
})
